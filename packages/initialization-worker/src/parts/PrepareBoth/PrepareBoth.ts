import type { MessagePort } from 'node:worker_threads'
import { join } from 'node:path'
import { connectDevtools } from '../ConnectDevtools/ConnectDevtools.ts'
import { connectElectron } from '../ConnectElectron/ConnectElectron.ts'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import { DevtoolsProtocolDebugger, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as FunctionTrackerState from '../FunctionTrackerState/FunctionTrackerState.ts'
import * as LaunchFunctionTrackerWorker from '../LaunchFunctionTrackerWorker/LaunchFunctionTrackerWorker.ts'
import * as MonkeyPatchElectronScript from '../MonkeyPatchElectronScript/MonkeyPatchElectronScript.ts'
import { PortReadStream } from '../PortReadStream/PortReadStream.ts'
import * as Root from '../Root/Root.ts'
import * as WaitForDebuggerListening from '../WaitForDebuggerListening/WaitForDebuggerListening.ts'
import * as WaitForDevtoolsListening from '../WaitForDevtoolsListening/WaitForDevtoolsListening.ts'

// TODO maybe pass it as argument from above
const HTTP_SERVER_PORT = 9876

export const prepareBoth = async (
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
): Promise<any> => {
  const stream = new PortReadStream(port)
  const webSocketUrl = await WaitForDebuggerListening.waitForDebuggerListening(stream)

  const devtoolsWebSocketUrlPromise = WaitForDevtoolsListening.waitForDevtoolsListening(stream)

  const electronIpc = await DebuggerCreateIpcConnection.createConnection(webSocketUrl)
  const electronRpc = DebuggerCreateRpcConnection.createRpc(electronIpc)

  const { electronObjectId, monkeyPatchedElectronId } = await connectElectron(
    electronRpc,
    headlessMode,
    trackFunctions,
    openDevtools,
    HTTP_SERVER_PORT,
    preGeneratedWorkbenchPath,
    measureId,
  )

  await DevtoolsProtocolDebugger.resume(electronRpc)

  const devtoolsWebSocketUrl = await devtoolsWebSocketUrlPromise

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

  // Wait for the page to be created by the initialization worker's connectDevtools
  const { dispose, sessionId, targetId } = await connectDevtoolsPromise

  await Promise.all([electronRpc.dispose(), dispose()])

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
