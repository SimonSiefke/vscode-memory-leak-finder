import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as MonkeyPatchElectronScript from '../MonkeyPatchElectronScript/MonkeyPatchElectronScript.ts'

export const connectFunctionTracker = async (
  electronRpc: any,
  monkeyPatchedElectronId: string,
  functionTrackerRpc: any,
  devtoolsWebSocketUrl: string,
  webSocketUrl: string,
  connectionId: number,
  measureId: string,
): Promise<void> => {
  // Connect function-tracker devtools BEFORE undoing monkey patch
  // This ensures the window is paused and we can intercept network requests
  await functionTrackerRpc.invoke('FunctionTracker.connectDevtools', devtoolsWebSocketUrl, webSocketUrl, connectionId, measureId)

  // Now undo the monkey patch to continue loading the window
  // The function-tracker is already connected and will intercept network requests
  await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
    functionDeclaration: MonkeyPatchElectronScript.undoMonkeyPatch,
    objectId: monkeyPatchedElectronId,
  })
}
