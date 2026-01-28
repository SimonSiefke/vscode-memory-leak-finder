import type { RpcConnection } from '../RpcConnection/RpcConnection.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as MakeElectronAvailableGlobally from '../MakeElectronAvailableGlobally/MakeElectronAvailableGlobally.ts'
import * as MakeRequireAvailableGlobally from '../MakeRequireAvailableGlobally/MakeRequireAvailableGlobally.ts'
import { monkeyPatchElectronHeadlessMode } from '../MonkeyPatchElectronHeadlessMode/MonkeyPatchElectronHeadlessMode.ts'
import * as MonkeyPatchElectronIpcMain from '../MonkeyPatchElectronScript/MonkeyPatchElectronIpcMain.ts'
import * as MonkeyPatchElectronScript from '../MonkeyPatchElectronScript/MonkeyPatchElectronScript.ts'
import { openDevtoolsScript } from '../OpenDevtoolsScript/OpenDevtoolsScript.ts'
import { protocolInterceptorScript } from '../ProtocolInterceptorScript/ProtocolInterceptorScript.ts'

export const applyMonkeyPatches = async (
  electronRpc: RpcConnection,
  electronObjectId: string,
  requireObjectId: string,
  headlessMode: boolean,
  trackFunctions: boolean,
  openDevtools: boolean,
  port: number,
  preGeneratedWorkbenchPath: string | null,
  measureId?: string,
): Promise<string> => {
  // TODO do this in parallel

  const monkeyPatchedElectron = await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
    functionDeclaration: MonkeyPatchElectronScript.monkeyPatchElectronScript,
    objectId: electronObjectId,
  })

  if (measureId && (measureId === 'ipcMessageCount' || measureId === 'ipcmessagecount')) {
    await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
      functionDeclaration: MonkeyPatchElectronIpcMain.monkeyPatchElectronIpcMain,
      objectId: electronObjectId,
    })
  }

  if (headlessMode) {
    await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
      functionDeclaration: monkeyPatchElectronHeadlessMode,
      objectId: electronObjectId,
    })
  }

  await Promise.all([
    MakeElectronAvailableGlobally.makeElectronAvailableGlobally(electronRpc, electronObjectId),
    MakeRequireAvailableGlobally.makeRequireAvailableGlobally(electronRpc, requireObjectId),
  ])

  if (trackFunctions) {
    await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
      functionDeclaration: protocolInterceptorScript(port, preGeneratedWorkbenchPath),
      objectId: electronObjectId,
    })
  }

  if (openDevtools) {
    await DevtoolsProtocolRuntime.evaluate(electronRpc, {
      awaitPromise: false,
      expression: openDevtoolsScript,
    })
  }

  return monkeyPatchedElectron.objectId
}
