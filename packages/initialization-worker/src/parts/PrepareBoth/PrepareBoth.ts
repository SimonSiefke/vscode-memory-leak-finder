import type { MessagePort } from 'node:worker_threads'
import { connectDevtools } from '../ConnectDevtools/ConnectDevtools.ts'
import { connectElectron } from '../ConnectElectron/ConnectElectron.ts'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import { DevtoolsProtocolDebugger, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as LaunchFunctionTrackerWorker from '../LaunchFunctionTrackerWorker/LaunchFunctionTrackerWorker.ts'
import * as MonkeyPatchElectronScript from '../MonkeyPatchElectronScript/MonkeyPatchElectronScript.ts'
import { PortReadStream } from '../PortReadStream/PortReadStream.ts'
import * as WaitForDebuggerListening from '../WaitForDebuggerListening/WaitForDebuggerListening.ts'
import * as WaitForDevtoolsListening from '../WaitForDevtoolsListening/WaitForDevtoolsListening.ts'

export const prepareBoth = async (
  headlessMode: boolean,
  attachedToPageTimeout: number,
  port: MessagePort,
  parsedVersion: any,
  trackFunctions: boolean,
  connectionId: number,
  measureId: string,
  pid: number,
): Promise<any> => {
  const stream = new PortReadStream(port)
  const webSocketUrl = await WaitForDebuggerListening.waitForDebuggerListening(stream)

  const devtoolsWebSocketUrlPromise = WaitForDevtoolsListening.waitForDevtoolsListening(stream)

  const electronIpc = await DebuggerCreateIpcConnection.createConnection(webSocketUrl)
  const electronRpc = DebuggerCreateRpcConnection.createRpc(electronIpc)

  const { electronObjectId, monkeyPatchedElectronId } = await connectElectron(electronRpc, headlessMode)

  await DevtoolsProtocolDebugger.resume(electronRpc)

  const devtoolsWebSocketUrl = await devtoolsWebSocketUrlPromise

  const connectDevtoolsPromise = connectDevtools(devtoolsWebSocketUrl, attachedToPageTimeout)

  if (headlessMode) {
    // TODO
  }

  // Wait for the page to be created by the initialization worker's connectDevtools
  // This ensures the page exists before we try to connect the function-tracker
  const { dispose, sessionId, targetId } = await connectDevtoolsPromise

  // Launch function-tracker worker if tracking is enabled
  // Connect it AFTER the page is created but BEFORE undoing monkey patch
  // This ensures the window is paused and we can intercept network requests
  let functionTrackerRpc: Awaited<ReturnType<typeof LaunchFunctionTrackerWorker.launchFunctionTrackerWorker>> | null = null
  if (trackFunctions) {
    functionTrackerRpc = await LaunchFunctionTrackerWorker.launchFunctionTrackerWorker()
    // Connect function-tracker devtools - the page now exists so it can attach
    await functionTrackerRpc.invoke('FunctionTracker.connectDevtools', devtoolsWebSocketUrl, webSocketUrl, connectionId, measureId)
  }

  // Now undo the monkey patch to continue loading the window
  // The function-tracker is already connected and will intercept network requests
  await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
    functionDeclaration: MonkeyPatchElectronScript.undoMonkeyPatch,
    objectId: monkeyPatchedElectronId,
  })

  // Dispose browserRpc but keep functionTrackerRpc alive (it will be disposed later by test-coordinator)
  await Promise.all([electronRpc.dispose(), dispose()])

  return {
    devtoolsWebSocketUrl,
    electronObjectId,
    functionTrackerRpc: functionTrackerRpc || undefined,
    monkeyPatchedElectronId,
    sessionId,
    targetId,
    utilityContext: undefined,
    webSocketUrl,
  }
}
