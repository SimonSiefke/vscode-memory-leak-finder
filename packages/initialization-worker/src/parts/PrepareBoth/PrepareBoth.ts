import type { MessagePort } from 'node:worker_threads'
import { connectDevtools } from '../ConnectDevtools/ConnectDevtools.ts'
import { connectElectron } from '../ConnectElectron/ConnectElectron.ts'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import * as ElectronRpcState from '../ElectronRpcState/ElectronRpcState.ts'
import { DevtoolsProtocolDebugger, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
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

  // Store electronRpc in state so ConnectFunctionTracker can access it
  // Don't dispose it here - it will be disposed in ConnectFunctionTracker
  ElectronRpcState.setElectronRpc(electronRpc, monkeyPatchedElectronId)

  if (!trackFunctions) {
    // If not tracking, undo monkey patch immediately and dispose electronRpc
    await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
      functionDeclaration: MonkeyPatchElectronScript.undoMonkeyPatch,
      objectId: monkeyPatchedElectronId,
    })
    await electronRpc.dispose()
    ElectronRpcState.clearElectronRpc()
  }

  // Dispose browserRpc from connectDevtools
  await dispose()

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
