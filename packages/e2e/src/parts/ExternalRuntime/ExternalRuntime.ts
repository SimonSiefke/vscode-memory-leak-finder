import { spawn } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { access, mkdir } from 'node:fs/promises'
import { createServer } from 'node:net'
import { join } from 'node:path'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'

type RuntimeName = 'bun' | 'node'

interface WorkspaceLike {
  add(file: { name: string; content: string }): Promise<void>
}

interface StartExternalRuntimeOptions {
  readonly Workspace: WorkspaceLike
  readonly entryFile: string
  readonly entrySource: string
  readonly inspectPort: number
  readonly runtimeName: RuntimeName
  readonly serverPort: number
}

interface InspectorTarget {
  readonly webSocketDebuggerUrl?: string
}

interface RpcResultEnvelope<T> {
  readonly result: T
}

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

interface RpcResponse<T> {
  readonly error?: unknown
  readonly id: number
  readonly result?: T
}

interface InspectorEvent {
  readonly method: string
  readonly params?: {
    readonly chunk?: string
  }
}

type RpcIncomingMessage<T> = InspectorEvent | RpcResponse<T>

const root = join(import.meta.dirname, '../../../../../')
const workspacePath = join(root, '.vscode-test-workspace')

const listen = async (server: ReturnType<typeof createServer>): Promise<number> => {
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      resolve()
    })
  })
  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Failed to determine ephemeral port')
  }
  return address.port
}

const closeServer = async (server: ReturnType<typeof createServer>): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error)
        return
      }
      resolve()
    })
  })
}

const getRandomPort = async (): Promise<number> => {
  const server = createServer()
  const port = await listen(server)
  await closeServer(server)
  return port
}

export const createPorts = async (): Promise<{ inspectPort: number; serverPort: number }> => {
  const [inspectPort, serverPort] = await Promise.all([getRandomPort(), getRandomPort()])
  if (inspectPort === serverPort) {
    return createPorts()
  }
  return {
    inspectPort,
    serverPort,
  }
}

const getRuntimeCommand = (runtimeName: RuntimeName, inspectPort: number, entryFile: string) => {
  if (runtimeName === 'bun') {
    return {
      args: [`--inspect=127.0.0.1:${inspectPort}`, entryFile],
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
    } catch {}
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

export interface ExternalRuntimeHandle {
  readonly inspectPort: number
  readonly runtimeName: RuntimeName
  readonly serverPort: number
  dispose(): Promise<void>
  evaluate(expression: string): Promise<unknown>
  request(path: string, init?: RequestInit): Promise<Response>
  takeSnapshot(name: string): Promise<string>
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
    } catch {}
    await delay(50)
  }
  throw new Error(`Timed out waiting for inspector endpoint on port ${port}`)
}

const connectWebSocket = async (webSocketUrl: string): Promise<WebSocket> => {
  const webSocket = new WebSocket(webSocketUrl)
  await new Promise<void>((resolve, reject) => {
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
  })
  return webSocket
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
      return new Promise<T>((resolve, reject) => {
        pending.set(requestId, { reject, resolve })
        webSocket.send(
          JSON.stringify({
            id: requestId,
            method,
            params,
          }),
        )
      })
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

const connectToInspector = async (inspectPort: number): Promise<RuntimeRpc> => {
  const targets = await getJson(inspectPort)
  if (targets.length !== 1) {
    throw new Error(`Expected one inspector target on port ${inspectPort} but found ${targets.length}`)
  }
  const target = targets[0]
  if (!target.webSocketDebuggerUrl) {
    throw new Error(`Expected inspector target on port ${inspectPort} to expose a websocket debugger URL`)
  }
  const webSocket = await connectWebSocket(target.webSocketDebuggerUrl)
  return createRpc(webSocket)
}

export const startExternalRuntime = async ({
  Workspace,
  entryFile,
  entrySource,
  inspectPort,
  runtimeName,
  serverPort,
}: StartExternalRuntimeOptions) => {
  await Workspace.add({
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
  await getJson(inspectPort)

  let rpc: RuntimeRpc | undefined
  let disposed = false

  const connect = async () => {
    if (!rpc) {
      rpc = await connectToInspector(inspectPort)
    }
    return rpc
  }

  const dispose = async () => {
    if (disposed) {
      return
    }
    disposed = true
    if (rpc) {
      await rpc.dispose()
    }
    if (childProcess.exitCode === null && childProcess.signalCode === null) {
      childProcess.kill('SIGTERM')
      try {
        await waitForExit(childProcess, 2_000)
      } catch {
        childProcess.kill('SIGKILL')
        await waitForExit(childProcess, 2_000)
      }
    }
  }

  return {
    inspectPort,
    runtimeName,
    serverPort,
    async dispose() {
      await dispose()
    },
    async evaluate(expression: string) {
      const runtimeRpc = await connect()
      const result = await runtimeRpc.invoke<RpcResultEnvelope<RuntimeEvaluateResult>>('Runtime.evaluate', {
        awaitPromise: true,
        expression,
        returnByValue: true,
      })
      return result.result?.value
    },
    request(path: string, init: RequestInit = {}) {
      const url = new URL(path, `http://127.0.0.1:${serverPort}`)
      return fetch(url, init)
    },
    async takeSnapshot(name: string) {
      const runtimeRpc = await connect()
      const outputDirectory = join(workspacePath, '.external-runtime')
      const outFile = join(outputDirectory, `${name}.json`)
      await mkdir(outputDirectory, { recursive: true })
      const writeStream = createWriteStream(outFile)
      const chunkListener = (message: InspectorEvent) => {
        const chunk = message.params?.chunk
        if (typeof chunk === 'string') {
          writeStream.write(chunk)
        }
      }
      runtimeRpc.on('HeapProfiler.addHeapSnapshotChunk', chunkListener)
      await runtimeRpc.invoke('HeapProfiler.takeHeapSnapshot', {
        captureNumericValues: true,
        exposeInternals: false,
        reportProgress: true,
      })
      runtimeRpc.off('HeapProfiler.addHeapSnapshotChunk', chunkListener)
      await new Promise<void>((resolve, reject) => {
        writeStream.end((error) => {
          if (error) {
            reject(error)
            return
          }
          resolve()
        })
      })
      await access(outFile)
      return outFile
    },
  } satisfies ExternalRuntimeHandle
}
