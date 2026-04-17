import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { spawn } from 'node:child_process'
import { access, copyFile, mkdir } from 'node:fs/promises'
import { createServer } from 'node:net'
import { join } from 'node:path'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'
import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as Root from '../Root/Root.ts'
import * as Workspace from '../Workspace/Workspace.ts'

type RuntimeName = 'bun' | 'node'

interface InspectorEvent {
  readonly method: string
  readonly params?: {
    readonly chunk?: string
  }
}

interface InspectorTarget {
  readonly webSocketDebuggerUrl?: string
}

interface RpcResponse<T> {
  readonly error?: unknown
  readonly id: number
  readonly result?: T
}

interface RpcResultEnvelope<T> {
  readonly result: T
}

type RpcIncomingMessage<T> = InspectorEvent | RpcResponse<T>

interface RuntimeEvaluateResult {
  readonly result?: {
    readonly value?: unknown
  }
}

interface RuntimeRpc {
  dispose(): void
  invoke<T>(method: string, params: Record<string, unknown>): Promise<T>
  off(event: string, listener: (message: InspectorEvent) => void): void
  on(event: string, listener: (message: InspectorEvent) => void): void
}

interface StartExternalRuntimeOptions {
  readonly entryFile: string
  readonly entrySource: string
  readonly inspectPort: number
  readonly moduleType?: 'commonjs' | 'module'
  readonly runtimeName?: RuntimeName
  readonly serverPort: number
}

export interface ExternalRuntimeHandle {
  readonly inspectPort: number
  readonly runtimeName: RuntimeName
  readonly serverPort: number
  dispose(): Promise<void>
  evaluate(expression: string): Promise<unknown>
  getJson<T>(path: string, init?: RequestInit): Promise<T>
  getRuntimeName(): Promise<RuntimeName>
  getNamedArrayCount(): Promise<Record<string, number>>
  request(path: string, init?: RequestInit): Promise<Response>
  takeSnapshot(name: string): Promise<string>
}

const workspacePath = join(Root.root, '.vscode-test-workspace')
const memoryLeakWorkerUrl = join(Root.root, 'packages', 'memory-leak-finder', 'bin', 'memory-leak-worker.ts')
const connectDevtoolsCommand = 'ConnectDevtools.connectDevtools'
const getHeapSnapshotForConnectionCommand = 'GetHeapSnapshotForConnection.getHeapSnapshotForConnection'
const getNamedArrayCountForConnectionCommand = 'GetNamedArrayCountForConnection.getNamedArrayCountForConnection'
const bunInspectorPath = '/memory-leak-finder'
const defaultMeasureId = 'string-count'

let nextConnectionId = 1
let nextSnapshotId = 1

const listen = async (server: ReturnType<typeof createServer>): Promise<number> => {
  const { promise, reject, resolve } = Promise.withResolvers<void>()
  server.once('error', reject)
  server.listen(0, '127.0.0.1', () => {
    resolve()
  })
  await promise
  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Failed to determine ephemeral port')
  }
  return address.port
}

const closeServer = async (server: ReturnType<typeof createServer>): Promise<void> => {
  const { promise, reject, resolve } = Promise.withResolvers<void>()
  server.close((error) => {
    if (error) {
      reject(error)
      return
    }
    resolve()
  })
  await promise
}

const getRandomPort = async (): Promise<number> => {
  const server = createServer()
  const port = await listen(server)
  await closeServer(server)
  return port
}

const getRuntimeCommand = (runtimeName: RuntimeName, inspectPort: number, entryFile: string) => {
  if (runtimeName === 'bun') {
    return {
      args: [`--inspect=127.0.0.1:${inspectPort}${bunInspectorPath}`, entryFile],
      command: 'bun',
    }
  }
  return {
    args: [`--inspect=${inspectPort}`, '--expose-gc', entryFile],
    command: process.execPath,
  }
}

const waitForHttpServer = async (url: string, getOutput: () => string, hasExited: () => boolean): Promise<void> => {
  for (let attempt = 0; attempt < 200; attempt++) {
    if (hasExited()) {
      throw new Error(`External runtime exited before HTTP server was ready\n${getOutput()}`)
    }
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(500),
      })
      if (response.ok) {
        return
      }
    } catch {
      // Ignore transient connection failures while the runtime is starting.
    }
    await delay(50)
  }
  throw new Error(`Timed out waiting for HTTP server ${url}\n${getOutput()}`)
}

const waitForExit = async (childProcess: ReturnType<typeof spawn>, timeout: number): Promise<void> => {
  const start = Date.now()
  while (childProcess.exitCode === null && childProcess.signalCode === null) {
    if (Date.now() - start > timeout) {
      throw new Error('Timed out waiting for external runtime to exit')
    }
    await delay(25)
  }
}

const getJson = async (port: number): Promise<readonly InspectorTarget[]> => {
  for (let attempt = 0; attempt < 200; attempt++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`, {
        signal: AbortSignal.timeout(500),
      })
      if (response.ok) {
        const value = await response.json()
        if (!Array.isArray(value)) {
          throw new Error('Expected /json/list response to be an array')
        }
        return value as readonly InspectorTarget[]
      }
    } catch {
      // Ignore transient failures while the inspector is starting.
    }
    await delay(50)
  }
  throw new Error(`Timed out waiting for inspector endpoint on port ${port}`)
}

const getBunInspectorWebSocketUrl = (inspectPort: number): string => {
  return `ws://127.0.0.1:${inspectPort}${bunInspectorPath}`
}

const getNodeInspectorWebSocketUrl = async (inspectPort: number): Promise<string> => {
  const targets = await getJson(inspectPort)
  if (targets.length !== 1) {
    throw new Error(`Expected one inspector target on port ${inspectPort} but found ${targets.length}`)
  }
  const target = targets[0]
  if (!target.webSocketDebuggerUrl) {
    throw new Error(`Expected inspector target on port ${inspectPort} to expose a websocket debugger URL`)
  }
  return target.webSocketDebuggerUrl
}

const connectWebSocket = async (webSocketUrl: string): Promise<WebSocket> => {
  const webSocket = new WebSocket(webSocketUrl)
  const { promise, reject, resolve } = Promise.withResolvers<void>()
  const handleOpen = () => {
    cleanup()
    resolve()
  }
  const handleError = (event: Event) => {
    cleanup()
    reject(new Error(`Failed to open inspector websocket for ${webSocketUrl}: ${event.type}`))
  }
  const cleanup = () => {
    webSocket.removeEventListener('open', handleOpen)
    webSocket.removeEventListener('error', handleError)
  }
  webSocket.addEventListener('open', handleOpen)
  webSocket.addEventListener('error', handleError)
  await promise
  return webSocket
}

const waitForInspector = async (runtimeName: RuntimeName, inspectPort: number): Promise<void> => {
  for (let attempt = 0; attempt < 200; attempt++) {
    try {
      if (runtimeName === 'bun') {
        const webSocket = await connectWebSocket(getBunInspectorWebSocketUrl(inspectPort))
        webSocket.close()
        return
      }
      await getNodeInspectorWebSocketUrl(inspectPort)
      return
    } catch {
      // Ignore transient failures while the inspector is starting.
    }
    await delay(50)
  }
  throw new Error(`Timed out waiting for ${runtimeName} inspector endpoint on port ${inspectPort}`)
}

const createRpc = (webSocket: WebSocket): RuntimeRpc => {
  let id = 0
  const listeners = new Map<string, Set<(message: InspectorEvent) => void>>()
  const pending = new Map<number, { reject(error: unknown): void; resolve(value: unknown): void }>()

  webSocket.addEventListener('message', (event: MessageEvent) => {
    const raw = typeof event.data === 'string' ? event.data : String(event.data)
    const message = JSON.parse(raw) as RpcIncomingMessage<unknown>
    if ('id' in message) {
      const callback = pending.get(message.id)
      if (!callback) {
        return
      }
      pending.delete(message.id)
      if (message.error) {
        callback.reject(message.error)
        return
      }
      callback.resolve(message.result)
      return
    }
    const eventListeners = listeners.get(message.method)
    if (!eventListeners) {
      return
    }
    for (const listener of eventListeners) {
      listener(message)
    }
  })

  return {
    dispose() {
      webSocket.close()
    },
    invoke<T>(method: string, params: Record<string, unknown>) {
      const requestId = id++
      const deferred = Promise.withResolvers<T>()
      pending.set(requestId, deferred)
      webSocket.send(
        JSON.stringify({
          id: requestId,
          method,
          params,
        }),
      )
      return deferred.promise
    },
    off(event: string, listener: (message: InspectorEvent) => void) {
      const eventListeners = listeners.get(event)
      if (!eventListeners) {
        return
      }
      eventListeners.delete(listener)
      if (eventListeners.size === 0) {
        listeners.delete(event)
      }
    },
    on(event: string, listener: (message: InspectorEvent) => void) {
      const eventListeners = listeners.get(event) || new Set<(message: InspectorEvent) => void>()
      eventListeners.add(listener)
      listeners.set(event, eventListeners)
    },
  }
}

const connectToInspector = async (runtimeName: RuntimeName, inspectPort: number): Promise<RuntimeRpc> => {
  const webSocketUrl = runtimeName === 'bun' ? getBunInspectorWebSocketUrl(inspectPort) : await getNodeInspectorWebSocketUrl(inspectPort)
  const webSocket = await connectWebSocket(webSocketUrl)
  return createRpc(webSocket)
}

export const create = ({
  electronApp,
  expect,
  externalInspectPort,
  ideVersion,
  page,
  platform,
  subprocessRuntime = 'node',
  VError,
}: CreateParams) => {
  const workspace = Workspace.create({ electronApp, expect, ideVersion, page, platform, VError })
  let activeRuntime: ExternalRuntimeHandle | undefined

  const getActiveRuntime = (): ExternalRuntimeHandle => {
    if (!activeRuntime) {
      throw new Error('Expected an external runtime to be started')
    }
    return activeRuntime
  }

  return {
    async createPorts(): Promise<{ inspectPort: number; serverPort: number }> {
      const inspectPort = externalInspectPort || (await getRandomPort())
      const serverPort = await getRandomPort()
      if (inspectPort === serverPort) {
        return this.createPorts()
      }
      return {
        inspectPort,
        serverPort,
      }
    },
    async startExternalRuntime({
      entryFile,
      entrySource,
      inspectPort,
      moduleType = 'module',
      runtimeName = subprocessRuntime,
      serverPort,
    }: StartExternalRuntimeOptions): Promise<void> {
      if (activeRuntime) {
        await activeRuntime.dispose()
        activeRuntime = undefined
      }
      if (moduleType === 'module') {
        await workspace.add({
          content: JSON.stringify(
            {
              name: 'external-runtime-fixture',
              private: true,
              type: 'module',
            },
            null,
            2,
          ),
          name: 'package.json',
        })
      }

      await workspace.add({
        content: entrySource,
        name: entryFile,
      })

      const { args, command } = getRuntimeCommand(runtimeName, inspectPort, entryFile)
      const stdout: string[] = []
      const stderr: string[] = []
      const childProcess = spawn(command, args, {
        cwd: workspacePath,
        env: {
          ...process.env,
          MEMORY_LEAK_FINDER_SERVER_PORT: String(serverPort),
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      })

      if (!childProcess.stdout || !childProcess.stderr) {
        throw new Error('Expected child process stdout and stderr to be available')
      }

      childProcess.stdout.setEncoding('utf8')
      childProcess.stderr.setEncoding('utf8')
      childProcess.stdout.on('data', (value: string) => {
        stdout.push(value)
      })
      childProcess.stderr.on('data', (value: string) => {
        stderr.push(value)
      })

      const getOutput = () => {
        return `stdout:\n${stdout.join('')}\nstderr:\n${stderr.join('')}`
      }

      await waitForHttpServer(
        `http://127.0.0.1:${serverPort}/health`,
        getOutput,
        () => childProcess.exitCode !== null || childProcess.signalCode !== null,
      )
      await waitForInspector(runtimeName, inspectPort)

      let rpc: RuntimeRpc | undefined
      const memoryRpc = await NodeWorkerRpcParent.create({
        commandMap: {},
        path: memoryLeakWorkerUrl,
        stdio: 'inherit',
      })
      const memoryConnectionId = nextConnectionId++
      let disposed = false

      await memoryRpc.invoke(
        connectDevtoolsCommand,
        '',
        '',
        memoryConnectionId,
        defaultMeasureId,
        30_000,
        false,
        false,
        false,
        false,
        0,
        0,
        0,
        childProcess.pid ?? 0,
        inspectPort,
        runtimeName,
      )

      const connect = async () => {
        if (!rpc) {
          rpc = await connectToInspector(runtimeName, inspectPort)
        }
        return rpc
      }

      activeRuntime = {
        inspectPort,
        runtimeName,
        serverPort,
        async dispose() {
          if (disposed) {
            return
          }
          disposed = true
          rpc?.dispose()
          await memoryRpc.dispose()
          if (childProcess.exitCode === null && childProcess.signalCode === null) {
            childProcess.kill('SIGTERM')
            try {
              await waitForExit(childProcess, 2_000)
            } catch {
              childProcess.kill('SIGKILL')
              await waitForExit(childProcess, 2_000)
            }
          }
        },
        async evaluate(expression: string) {
          const runtimeRpc = await connect()
          const result = await runtimeRpc.invoke<RpcResultEnvelope<RuntimeEvaluateResult>>('Runtime.evaluate', {
            awaitPromise: true,
            expression,
            returnByValue: true,
          })
          return result.result?.result?.value
        },
        async getJson<T>(path: string, init: RequestInit = {}) {
          const response = await this.request(path, init)
          if (!response.ok) {
            throw new Error(`Expected ${path} to respond with 200 but received ${response.status}`)
          }
          return (await response.json()) as T
        },
        async getNamedArrayCount() {
          const snapshotId = nextSnapshotId++
          const result = (await memoryRpc.invoke(getNamedArrayCountForConnectionCommand, memoryConnectionId, '', snapshotId)) as Record<
            string,
            number
          >
          return result
        },
        async getRuntimeName() {
          return runtimeName
        },
        request(path: string, init: RequestInit = {}) {
          const url = new URL(path, `http://127.0.0.1:${serverPort}`)
          return fetch(url, init)
        },
        async takeSnapshot(name: string) {
          const snapshotId = nextSnapshotId++
          const sourcePath = (await memoryRpc.invoke(getHeapSnapshotForConnectionCommand, memoryConnectionId, snapshotId)) as string
          const outFile = join(workspacePath, '.external-runtime', `${name}.json`)
          await mkdir(join(workspacePath, '.external-runtime'), { recursive: true })
          await copyFile(sourcePath, outFile)
          await access(outFile)
          return outFile
        },
      } satisfies ExternalRuntimeHandle

      return
    },
    async dispose(): Promise<void> {
      if (!activeRuntime) {
        return
      }
      const runtime = activeRuntime
      activeRuntime = undefined
      await runtime.dispose()
    },
    evaluate(expression: string): Promise<unknown> {
      return getActiveRuntime().evaluate(expression)
    },
    getJson<T>(path: string, init?: RequestInit): Promise<T> {
      return getActiveRuntime().getJson<T>(path, init)
    },
    getRuntimeName(): Promise<RuntimeName> {
      return getActiveRuntime().getRuntimeName()
    },
    getNamedArrayCount(): Promise<Record<string, number>> {
      return getActiveRuntime().getNamedArrayCount()
    },
    request(path: string, init?: RequestInit): Promise<Response> {
      return getActiveRuntime().request(path, init)
    },
    takeSnapshot(name: string): Promise<string> {
      return getActiveRuntime().takeSnapshot(name)
    },
  }
}
