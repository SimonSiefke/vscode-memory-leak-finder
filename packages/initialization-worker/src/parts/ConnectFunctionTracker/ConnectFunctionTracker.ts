import * as ElectronRpcState from '../ElectronRpcState/ElectronRpcState.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as MonkeyPatchElectronScript from '../MonkeyPatchElectronScript/MonkeyPatchElectronScript.ts'

export const connectFunctionTracker = async (): Promise<void> => {
  const electronRpcState = ElectronRpcState.getElectronRpc()
  if (!electronRpcState) {
    throw new Error('electronRpc not found in state. Make sure PrepareBoth was called first.')
  }

  const { electronRpc, monkeyPatchedElectronId } = electronRpcState

  // Undo the monkey patch to continue loading the window
  // The function-tracker should already be connected before this is called
  await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
    functionDeclaration: MonkeyPatchElectronScript.undoMonkeyPatch,
    objectId: monkeyPatchedElectronId,
  })

  // Dispose electronRpc after undoing monkey patch
  await electronRpc.dispose()
  ElectronRpcState.clearElectronRpc()
}
