import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import { DevtoolsProtocolDebugger, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as MakeElectronAvailableGlobally from '../MakeElectronAvailableGlobally/MakeElectronAvailableGlobally.ts'
import * as MakeRequireAvailableGlobally from '../MakeRequireAvailableGlobally/MakeRequireAvailableGlobally.ts'
import { monkeyPatchElectronHeadlessMode } from '../MonkeyPatchElectronHeadlessMode/MonkeyPatchElectronHeadlessMode.ts'
import * as MonkeyPatchElectronScript from '../MonkeyPatchElectronScript/MonkeyPatchElectronScript.ts'
import * as MonkeyPatchElectronIpcMain from '../MonkeyPatchElectronScript/MonkeyPatchElectronIpcMain.ts'
import { protocolInterceptorScript } from '../ProtocolInterceptorScript/ProtocolInterceptorScript.ts'
import { VError } from '../VError/VError.ts'
import { applyMonkeyPatches } from '../ApplyMonkeyPatches/ApplyMonkeyPatches.ts'
import { RpcConnection } from '../RpcConnection/RpcConnection.ts'

const waitForDebuggerToBePaused = async (rpc: RpcConnection) => {
  try {
    const msg = await rpc.once(DevtoolsEventType.DebuggerPaused)
    return msg
  } catch (error) {
    throw new VError(error, `Failed to wait for debugger`)
  }
}

export const connectElectron = async (
  electronRpc: RpcConnection,
  headlessMode: boolean,
  trackFunctions: boolean,
  openDevtools: boolean,
  port: number,
  preGeneratedWorkbenchPath: string | null,
  measureId?: string,
) => {
  const debuggerPausedPromise = waitForDebuggerToBePaused(electronRpc)
  await Promise.all([
    DevtoolsProtocolDebugger.enable(electronRpc),
    DevtoolsProtocolRuntime.enable(electronRpc),
    DevtoolsProtocolRuntime.runIfWaitingForDebugger(electronRpc),
  ])
  const msg = await debuggerPausedPromise
  const callFrame = msg.params.callFrames[0]
  const { callFrameId } = callFrame

  // TODO do this in parallel
  const electron = await DevtoolsProtocolDebugger.evaluateOnCallFrame(electronRpc, {
    callFrameId,
    expression: `require('electron')`,
    generatePreview: true,
    includeCommandLineAPI: true,
  })
  const require = await DevtoolsProtocolDebugger.evaluateOnCallFrame(electronRpc, {
    callFrameId,
    expression: `require`,
    generatePreview: true,
    includeCommandLineAPI: true,
  })

  const electronObjectId = electron.result.result.objectId
  const requireObjectId = require.result.result.objectId

  const monkeyPatchedElectronId = await applyMonkeyPatches(
    electronRpc,
    electronObjectId,
    requireObjectId,
    headlessMode,
    trackFunctions,
    openDevtools,
    port,
    preGeneratedWorkbenchPath,
    measureId,
  )

  await DevtoolsProtocolRuntime.runIfWaitingForDebugger(electronRpc)

  return {
    electronObjectId,
    monkeyPatchedElectronId: monkeyPatchedElectronId,
  }
}
