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

  const connectDevtoolsPromise = connectDevtools(devtoolsWebSocketUrl, attachedToPageTimeout)

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

  // Wait for the page to be created by the initialization worker's connectDevtools
  const { dispose, sessionId, targetId } = await connectDevtoolsPromise
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
