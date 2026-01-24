import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import { DevtoolsProtocolDebugger, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as MakeElectronAvailableGlobally from '../MakeElectronAvailableGlobally/MakeElectronAvailableGlobally.ts'
import * as MakeRequireAvailableGlobally from '../MakeRequireAvailableGlobally/MakeRequireAvailableGlobally.ts'
import { monkeyPatchElectronHeadlessMode } from '../MonkeyPatchElectronHeadlessMode/MonkeyPatchElectronHeadlessMode.ts'
import * as MonkeyPatchElectronScript from '../MonkeyPatchElectronScript/MonkeyPatchElectronScript.ts'
import * as MonkeyPatchElectronIpcMain from '../MonkeyPatchElectronScript/MonkeyPatchElectronIpcMain.ts'
import { protocolInterceptorScript } from '../ProtocolInterceptorScript/ProtocolInterceptorScript.ts'
import { VError } from '../VError/VError.ts'
import { openDevtoolsScript } from '../OpenDevtoolsScript/OpenDevtoolsScript.ts'

interface RpcConnection {
  dispose(): Promise<void>
  invoke(method: string, params?: unknown): Promise<unknown>
  once(event: string): Promise<{ params: { callFrames: Array<{ callFrameId: string }> } }>
}

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
) => {
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
      expression: openDevtoolsScript,
      awaitPromise: false,
    })
  }

  await DevtoolsProtocolRuntime.runIfWaitingForDebugger(electronRpc)

  return {
    electronObjectId,
    monkeyPatchedElectronId: monkeyPatchedElectron.objectId,
  }
}
