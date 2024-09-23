import * as Assert from '../Assert/Assert.js'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.js'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.js'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.js'
import { DevtoolsProtocolDebugger, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as IntermediateConnectionState from '../IntermediateConnectionState/IntermediateConnectionState.js'
import * as IsPausedOnStartEvent from '../IsPausedOnStartEvent/IsPausedOnStartEvent.js'
import * as MonkeyPatchElectronHeadlessMode from '../MonkeyPatchElectronHeadlessMode/MonkeyPatchElectronHeadlessMode.js'
import * as MonkeyPatchElectronScript from '../MonkeyPatchElectronScript/MonkeyPatchElectronScript.js'
import * as ScenarioFunctions from '../ScenarioFunctions/ScenarioFunctions.js'
import * as WaitForDebuggerToBePaused from '../WaitForDebuggerToBePaused/WaitForDebuggerToBePaused.js'

export const connectElectron = async (connectionId, headlessMode, webSocketUrl, isFirstConnection, canUseIdleCallback) => {
  Assert.number(connectionId)
  Assert.boolean(headlessMode)
  Assert.string(webSocketUrl)
  Assert.boolean(isFirstConnection)
  Assert.boolean(canUseIdleCallback)
  const electronIpc = await DebuggerCreateIpcConnection.createConnection(webSocketUrl)
  const electronRpc = DebuggerCreateRpcConnection.createRpc(electronIpc, canUseIdleCallback)
  IntermediateConnectionState.set(connectionId, electronRpc)

  const handleIntermediatePaused = async (x) => {
    electronRpc.off(DevtoolsEventType.DebuggerPaused, handleIntermediatePaused)
    // since electron 29, electron cause pause again during connecting
    if (IsPausedOnStartEvent.isPausedOnStartEvent(x)) {
      await DevtoolsProtocolDebugger.resume(electronRpc)
      return
    }
  }

  electronRpc.on(DevtoolsEventType.DebuggerResumed, ScenarioFunctions.handleResumed)
  electronRpc.on(DevtoolsEventType.DebuggerScriptParsed, ScenarioFunctions.handleScriptParsed)
  electronRpc.on(DevtoolsEventType.RuntimeExecutionContextCreated, ScenarioFunctions.handleRuntimeExecutionContextCreated)
  electronRpc.on(DevtoolsEventType.RuntimeExecutionContextDestroyed, ScenarioFunctions.handleRuntimeExecutionContextDestroyed)

  let debuggerPausedPromise
  if (isFirstConnection) {
    debuggerPausedPromise = WaitForDebuggerToBePaused.waitForDebuggerToBePaused(electronRpc)
  }
  await Promise.all([
    DevtoolsProtocolDebugger.enable(electronRpc),
    DevtoolsProtocolRuntime.enable(electronRpc),
    DevtoolsProtocolRuntime.runIfWaitingForDebugger(electronRpc),
  ])
  if (!isFirstConnection) {
    return
  }
  const msg = await debuggerPausedPromise
  const callFrame = msg.params.callFrames[0]
  const callFrameId = callFrame.callFrameId

  const electron = await DevtoolsProtocolDebugger.evaluateOnCallFrame(electronRpc, {
    callFrameId,
    expression: `require('electron')`,
    generatePreview: true,
    includeCommandLineAPI: true,
  })
  await DevtoolsProtocolRuntime.runIfWaitingForDebugger(electronRpc)

  const electronObjectId = electron.result.result.objectId
  if (headlessMode) {
    await DevtoolsProtocolDebugger.evaluateOnCallFrame(electronRpc, {
      callFrameId,
      expression: MonkeyPatchElectronHeadlessMode.monkeyPatchElectronScript,
    })
  }
  const monkeyPatchedElectron = await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
    functionDeclaration: MonkeyPatchElectronScript.monkeyPatchElectronScript,
    objectId: electronObjectId,
  })

  electronRpc.on(DevtoolsEventType.DebuggerPaused, handleIntermediatePaused)

  await DevtoolsProtocolDebugger.resume(electronRpc)

  return {
    monkeyPatchedElectron,
    electronObjectId,
    callFrameId,
  }
}
