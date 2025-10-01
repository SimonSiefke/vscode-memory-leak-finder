import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import { DevtoolsProtocolDebugger, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as MakeElectronAvailableGlobally from '../MakeElectronAvailableGlobally/MakeElectronAvailableGlobally.ts'
import * as MakeRequireAvailableGlobally from '../MakeRequireAvailableGlobally/MakeRequireAvailableGlobally.ts'
import { monkeyPatchElectronHeadlessMode } from '../MonkeyPatchElectronHeadlessMode/MonkeyPatchElectronHeadlessMode.ts'
import * as MonkeyPatchElectronScript from '../MonkeyPatchElectronScript/MonkeyPatchElectronScript.ts'
import * as MonkeyPatchUtilityProcess from '../MonkeyPatchUtilityProcess/MonkeyPatchUtilityProcess.ts'
import { VError } from '../VError/VError.ts'

const waitForDebuggerToBePaused = async (rpc) => {
  try {
    const msg = await rpc.once(DevtoolsEventType.DebuggerPaused)
    return msg
  } catch (error) {
    throw new VError(error, `Failed to wait for debugger`)
  }
}

export const connectElectron = async (electronRpc, headlessMode) => {
  const debuggerPausedPromise = waitForDebuggerToBePaused(electronRpc)
  await Promise.all([
    DevtoolsProtocolDebugger.enable(electronRpc),
    DevtoolsProtocolRuntime.enable(electronRpc),
    DevtoolsProtocolRuntime.runIfWaitingForDebugger(electronRpc),
  ])
  const msg = await debuggerPausedPromise
  const callFrame = msg.params.callFrames[0]
  const { callFrameId } = callFrame

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

  // TODO headlessmode

  const monkeyPatchedElectron = await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
    functionDeclaration: MonkeyPatchElectronScript.monkeyPatchElectronScript,
    objectId: electronObjectId,
  })

  // Apply utility process monkey patch
  const monkeyPatchedUtilityProcess = await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
    functionDeclaration: MonkeyPatchUtilityProcess.monkeyPatchUtilityProcessScript,
    objectId: electronObjectId,
  })

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

  await DevtoolsProtocolRuntime.runIfWaitingForDebugger(electronRpc)

  return {
    monkeyPatchedElectronId: monkeyPatchedElectron.objectId,
    monkeyPatchedUtilityProcessId: monkeyPatchedUtilityProcess.objectId,
    electronObjectId,
  }
}
