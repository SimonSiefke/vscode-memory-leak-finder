import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { access, copyFile, cp, mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'
import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as Root from '../Root/Root.ts'

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
  readonly inspectPort: number
  readonly moduleType?: 'commonjs' | 'module'
  readonly runtimeName?: RuntimeName
  readonly serverPort: number
  readonly healthPath?: string
  readonly cwd?: string
  readonly env?: Record<string, string>
  readonly command?: string
  readonly args?: readonly string[]
  readonly setupCommands?: readonly SetupCommand[]
  readonly setupFiles?: readonly SetupFile[]
  readonly entryFile?: string
  readonly entrySource?: string
}

interface SetupCommand {
  readonly command: string
  readonly args?: readonly string[]
  readonly cwd?: string
}

interface SetupFile {
  readonly name: string
  readonly content: string
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
const projectCachePath = join(Root.root, '.vscode-project-cache')
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

const getExternalRuntimeLaunch = ({
  args,
  command,
  entryFile,
  inspectPort,
  runtimeName,
}: {
  readonly args: readonly string[] | undefined
  readonly command: string | undefined
  readonly entryFile: string | undefined
  readonly inspectPort: number
  readonly runtimeName: RuntimeName
}) => {
  if (command) {
    return {
      args: [...(args ?? [])],
      command,
    }
  }
  if (!entryFile) {
    throw new Error('Expected either command or entryFile to be provided')
  }
  return getRuntimeCommand(runtimeName, inspectPort, entryFile)
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

const exists = async (path: string): Promise<boolean> => {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

const writeProjectFile = async ({
  content,
  name,
  projectPath,
}: {
  readonly content: string
  readonly name: string
  readonly projectPath: string
}): Promise<void> => {
  const absolutePath = join(projectPath, name)
  await mkdir(dirname(absolutePath), { recursive: true })
  await writeFile(absolutePath, content)
}

const sortRecord = (record: Record<string, string> | undefined): Record<string, string> | undefined => {
  if (!record) {
    return undefined
  }
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)))
}

const getProjectSetupHash = ({
  entryFile,
  entrySource,
  env,
  moduleType,
  setupCommands,
  setupFiles,
}: {
  readonly entryFile: string | undefined
  readonly entrySource: string | undefined
  readonly env: Record<string, string> | undefined
  readonly moduleType: 'commonjs' | 'module'
  readonly setupCommands: readonly SetupCommand[]
  readonly setupFiles: readonly SetupFile[]
}): string => {
  return createHash('sha256')
    .update(
      JSON.stringify({
        entryFile,
        entrySource,
        env: sortRecord(env),
        moduleType,
        setupCommands,
        setupFiles,
      }),
    )
    .digest('hex')
}

const copyDirectoryContents = async (sourcePath: string, destinationPath: string): Promise<void> => {
  await mkdir(destinationPath, { recursive: true })
  const dirents = await readdir(sourcePath)
  for (const dirent of dirents) {
    await cp(join(sourcePath, dirent), join(destinationPath, dirent), { force: true, recursive: true })
  }
}

const runSetupCommand = async ({
  command,
  args = [],
  cwd,
  env,
  projectPath,
  stderr,
  stdout,
}: {
  readonly command: string
  readonly args: readonly string[] | undefined
  readonly cwd: string | undefined
  readonly env: Record<string, string>
  readonly projectPath: string
  readonly stderr: string[]
  readonly stdout: string[]
}): Promise<void> => {
  const childProcess = spawn(command, args, {
    cwd: cwd ? join(projectPath, cwd) : projectPath,
    env: {
      ...process.env,
      ...env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  if (!childProcess.stdout || !childProcess.stderr) {
    throw new Error(`Expected stdout and stderr for setup command ${command}`)
  }

  childProcess.stdout.setEncoding('utf8')
  childProcess.stderr.setEncoding('utf8')
  childProcess.stdout.on('data', (value: string) => {
    stdout.push(value)
  })
  childProcess.stderr.on('data', (value: string) => {
    stderr.push(value)
  })

  await waitForExit(childProcess, 10 * 60_000)

  if (childProcess.exitCode !== 0) {
    throw new Error(`Setup command failed: ${command} ${args.join(' ')}`)
  }
}

const populateProjectSetup = async ({
  entryFile,
  entrySource,
  env,
  moduleType,
  projectPath,
  setupCommands,
  setupFiles,
  stderr,
  stdout,
}: {
  readonly entryFile: string | undefined
  readonly entrySource: string | undefined
  readonly env: Record<string, string>
  readonly moduleType: 'commonjs' | 'module'
  readonly projectPath: string
  readonly setupCommands: readonly SetupCommand[]
  readonly setupFiles: readonly SetupFile[]
  readonly stderr: string[]
  readonly stdout: string[]
}): Promise<void> => {
  if (entrySource && moduleType === 'module') {
    await writeProjectFile({
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
      projectPath,
    })
  }

  if (entryFile && entrySource) {
    await writeProjectFile({
      content: entrySource,
      name: entryFile,
      projectPath,
    })
  }

  for (const setupCommand of setupCommands) {
    await runSetupCommand({
      args: setupCommand.args,
      command: setupCommand.command,
      cwd: setupCommand.cwd,
      env,
      projectPath,
      stderr,
      stdout,
    })
  }

  for (const setupFile of setupFiles) {
    await writeProjectFile({
      content: setupFile.content,
      name: setupFile.name,
      projectPath,
    })
  }
}

const prepareProjectSetup = async ({
  entryFile,
  entrySource,
  env,
  moduleType,
  setupCommands,
  setupFiles,
  stderr,
  stdout,
}: {
  readonly entryFile: string | undefined
  readonly entrySource: string | undefined
  readonly env: Record<string, string>
  readonly moduleType: 'commonjs' | 'module'
  readonly setupCommands: readonly SetupCommand[]
  readonly setupFiles: readonly SetupFile[]
  readonly stderr: string[]
  readonly stdout: string[]
}): Promise<void> => {
  const shouldUseCache = !!entrySource || setupCommands.length > 0 || setupFiles.length > 0
  if (!shouldUseCache) {
    return
  }

  await mkdir(projectCachePath, { recursive: true })
  const setupHash = getProjectSetupHash({
    entryFile,
    entrySource,
    env,
    moduleType,
    setupCommands,
    setupFiles,
  })
  const cachePath = join(projectCachePath, setupHash)
  const pendingCachePath = `${cachePath}--pending`

  if (await exists(cachePath)) {
    await copyDirectoryContents(cachePath, workspacePath)
    return
  }

  await rm(pendingCachePath, { force: true, recursive: true })
  await mkdir(pendingCachePath, { recursive: true })

  try {
    await populateProjectSetup({
      entryFile,
      entrySource,
      env,
      moduleType,
      projectPath: pendingCachePath,
      setupCommands,
      setupFiles,
      stderr,
      stdout,
    })
    try {
      await rename(pendingCachePath, cachePath)
    } catch {
      if (!(await exists(cachePath))) {
        throw new Error(`Failed to finalize project setup cache ${cachePath}`)
      }
      await rm(pendingCachePath, { force: true, recursive: true })
    }
    await copyDirectoryContents(cachePath, workspacePath)
  } catch (error) {
    await rm(pendingCachePath, { force: true, recursive: true })
    throw error
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

export const create = ({ externalInspectPort, subprocessRuntime = 'node' }: CreateParams) => {
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
      args,
      command,
      cwd,
      entryFile,
      entrySource,
      env,
      healthPath = '/health',
      inspectPort,
      moduleType = 'module',
      runtimeName = subprocessRuntime,
      serverPort,
      setupCommands = [],
      setupFiles = [],
    }: StartExternalRuntimeOptions): Promise<void> {
      if (activeRuntime) {
        await activeRuntime.dispose()
        activeRuntime = undefined
      }
      const launch = getExternalRuntimeLaunch({
        args,
        command,
        entryFile,
        inspectPort,
        runtimeName,
      })
      const stdout: string[] = []
      const stderr: string[] = []
      const runtimeEnv = {
        MEMORY_LEAK_FINDER_SERVER_PORT: String(serverPort),
        ...env,
      }

      await prepareProjectSetup({
        entryFile,
        entrySource,
        env: runtimeEnv,
        moduleType,
        setupCommands,
        setupFiles,
        stderr,
        stdout,
      })

      const childProcess = spawn(launch.command, launch.args, {
        cwd: cwd ? join(workspacePath, cwd) : workspacePath,
        env: {
          ...process.env,
          ...runtimeEnv,
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
        `http://127.0.0.1:${serverPort}${healthPath}`,
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
