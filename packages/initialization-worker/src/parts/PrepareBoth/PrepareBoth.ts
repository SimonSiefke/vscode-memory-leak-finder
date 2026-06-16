import type { MessagePort } from 'node:worker_threads'
import { connectDevtools } from '../ConnectDevtools/ConnectDevtools.ts'
import { connectElectron } from '../ConnectElectron/ConnectElectron.ts'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import { DevtoolsProtocolDebugger, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { launchFunctionTrackerAndPreGenerateWorkbench } from '../LaunchFunctionTrackerWorker/LaunchFunctionTrackerAndPreGenerateWorkbench.ts'
import * as MonkeyPatchElectronScript from '../MonkeyPatchElectronScript/MonkeyPatchElectronScript.ts'
import { PortReadStream } from '../PortReadStream/PortReadStream.ts'
import * as WaitForDebuggerListening from '../WaitForDebuggerListening/WaitForDebuggerListening.ts'
import * as WaitForDevtoolsListening from '../WaitForDevtoolsListening/WaitForDevtoolsListening.ts'

// TODO maybe pass it as argument from above
const HTTP_SERVER_PORT = 9876
const DEVTOOLS_TARGET_LIST_POLL_INTERVAL = 250
const DEVTOOLS_TARGET_LIST_REQUEST_TIMEOUT = 500

interface DevtoolsJsonTarget {
  readonly id?: string
  readonly title?: string
  readonly type?: string
  readonly url?: string
  readonly webSocketDebuggerUrl?: string
}

const shouldConnectDevtoolsAfterReady = (): boolean => {
  return process.platform === 'darwin'
}

const delay = (timeout: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout)
  })
}

const getDevtoolsJsonListUrl = (devtoolsWebSocketUrl: string): string => {
  const url = new URL(devtoolsWebSocketUrl)
  url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:'
  url.pathname = '/json/list'
  url.search = ''
  url.hash = ''
  return url.toString()
}

const isAttachableDevtoolsJsonTarget = (target: DevtoolsJsonTarget): boolean => {
  if (target.type === 'page') {
    return true
  }
  if (target.type !== 'tab') {
    return false
  }
  return !target.url?.startsWith('devtools://')
}

const formatDevtoolsJsonTarget = (target: DevtoolsJsonTarget): string => {
  return `${target.type ?? '<unknown>'} id=${target.id ?? '<unknown>'} url=${JSON.stringify(target.url ?? '')} title=${JSON.stringify(target.title ?? '')} ws=${target.webSocketDebuggerUrl ? '<present>' : '<missing>'}`
}

const getAttachableDevtoolsJsonTarget = (targets: readonly DevtoolsJsonTarget[]): DevtoolsJsonTarget | undefined => {
  return targets.find(isAttachableDevtoolsJsonTarget)
}

const fetchDevtoolsJsonTargets = async (jsonListUrl: string, timeout: number): Promise<readonly DevtoolsJsonTarget[]> => {
  const response = await fetch(jsonListUrl, {
    signal: AbortSignal.timeout(timeout),
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  const targets = await response.json()
  if (!Array.isArray(targets)) {
    throw new TypeError(`Expected /json/list response to be an array`)
  }
  return targets
}

const waitForDevtoolsJsonTarget = async (devtoolsWebSocketUrl: string, timeout: number): Promise<void> => {
  const jsonListUrl = getDevtoolsJsonListUrl(devtoolsWebSocketUrl)
  const deadline = Date.now() + timeout
  let lastError: unknown
  let lastTargets: readonly DevtoolsJsonTarget[] = []
  console.error(`[macos-ci-debug] prepareBoth waiting for /json/list target url=${jsonListUrl}`)

  while (true) {
    const remaining = Math.max(deadline - Date.now(), 0)
    if (remaining === 0) {
      break
    }
    try {
      const requestTimeout = Math.max(1, Math.min(DEVTOOLS_TARGET_LIST_REQUEST_TIMEOUT, remaining))
      lastTargets = await fetchDevtoolsJsonTargets(jsonListUrl, requestTimeout)
      console.error(
        `[macos-ci-debug] /json/list targets: ${lastTargets.length === 0 ? '<none>' : lastTargets.map(formatDevtoolsJsonTarget).join('; ')}`,
      )
      const target = getAttachableDevtoolsJsonTarget(lastTargets)
      if (target) {
        console.error(`[macos-ci-debug] /json/list attachable target ready: ${formatDevtoolsJsonTarget(target)}`)
        return
      }
    } catch (error) {
      lastError = error
      if (error instanceof Error) {
        console.error(`[macos-ci-debug] /json/list target poll failed: ${error.message}`)
      } else {
        console.error(`[macos-ci-debug] /json/list target poll failed: ${error}`)
      }
    }
    await delay(Math.min(DEVTOOLS_TARGET_LIST_POLL_INTERVAL, Math.max(deadline - Date.now(), 0)))
  }

  const detail =
    lastError instanceof Error
      ? `last error: ${lastError.message}`
      : `last targets: ${lastTargets.length === 0 ? '<none>' : lastTargets.map(formatDevtoolsJsonTarget).join('; ')}`
  throw new Error(`Timed out waiting for attachable DevTools target from /json/list after ${timeout}ms (${detail})`)
}

export const prepareBoth = async (
  secretsPath: string,
  headlessMode: boolean,
  attachedToPageTimeout: number,
  port: MessagePort,
  parsedVersion: any,
  trackFunctions: boolean,
  openDevtools: boolean,
  connectionId: number,
  measureId: string,
  pid: number,
  preGeneratedWorkbenchPath: string | null,
  binaryPath: string | null,
): Promise<any> => {
  console.error(
    `[macos-ci-debug] prepareBoth start platform=${process.platform} arch=${process.arch} headless=${headlessMode} timeout=${attachedToPageTimeout} vscode=${parsedVersion?.version ?? '<unknown>'}`,
  )
  // Launch function-tracker worker BEFORE PrepareBoth if tracking is enabled
  // This ensures the socket server is ready when the protocol interceptor is injected
  if (trackFunctions && binaryPath) {
    await launchFunctionTrackerAndPreGenerateWorkbench(binaryPath, preGeneratedWorkbenchPath)
  }

  const stream = new PortReadStream(port)
  console.error(`[macos-ci-debug] prepareBoth waiting for debugger websocket`)
  const webSocketUrl = await WaitForDebuggerListening.waitForDebuggerListening(stream)

  console.error(`[macos-ci-debug] prepareBoth waiting for devtools websocket`)
  const devtoolsWebSocketUrlPromise = WaitForDevtoolsListening.waitForDevtoolsListening(stream)

  const electronIpc = await DebuggerCreateIpcConnection.createConnection(webSocketUrl)
  console.error(`[macos-ci-debug] prepareBoth electron websocket connected`)
  const electronRpc = DebuggerCreateRpcConnection.createRpc(electronIpc)

  const { electronObjectId, monkeyPatchedElectronId } = await connectElectron(
    electronRpc,
    secretsPath,
    headlessMode,
    trackFunctions,
    openDevtools,
    HTTP_SERVER_PORT,
    preGeneratedWorkbenchPath,
    measureId,
  )
  console.error(`[macos-ci-debug] prepareBoth connectElectron complete electronObjectId=${electronObjectId}`)

  await DevtoolsProtocolDebugger.resume(electronRpc)
  console.error(`[macos-ci-debug] prepareBoth resumed debugger after monkey patch`)

  const devtoolsWebSocketUrl = await devtoolsWebSocketUrlPromise
  console.error(`[macos-ci-debug] prepareBoth devtools websocket ready`)

  const connectAfterReady = shouldConnectDevtoolsAfterReady()
  const connectDevtoolsPromise = connectAfterReady ? undefined : connectDevtools(devtoolsWebSocketUrl, attachedToPageTimeout)

  if (headlessMode) {
    // TODO
  }

  // Always undo monkey patch immediately to allow page creation
  // When tracking, we'll pause again after function-tracker is connected
  await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
    functionDeclaration: MonkeyPatchElectronScript.undoMonkeyPatch,
    objectId: monkeyPatchedElectronId,
  })
  console.error(`[macos-ci-debug] prepareBoth undo monkey patch complete`)

  if (connectAfterReady) {
    await waitForDevtoolsJsonTarget(devtoolsWebSocketUrl, attachedToPageTimeout)
  }

  const connectDevtoolsResult = connectAfterReady
    ? await connectDevtools(devtoolsWebSocketUrl, attachedToPageTimeout)
    : await connectDevtoolsPromise

  // Wait for the page to be created by the initialization worker's connectDevtools
  const { dispose, sessionId, targetId } = connectDevtoolsResult
  console.error(`[macos-ci-debug] prepareBoth connectDevtools complete sessionId=${sessionId} targetId=${targetId}`)

  await Promise.all([electronRpc.dispose(), dispose()])
  console.error(`[macos-ci-debug] prepareBoth disposed init connections`)

  return {
    devtoolsWebSocketUrl,
    electronObjectId,
    monkeyPatchedElectronId,
    sessionId,
    targetId,
    utilityContext: undefined,
    webSocketUrl,
  }
}
