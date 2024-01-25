import * as Assert from '../Assert/Assert.js'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.js'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.js'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.js'
import { DevtoolsProtocolDebugger, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as IntermediateConnectionState from '../IntermediateConnectionState/IntermediateConnectionState.js'
import * as MonkeyPatchElectronHeadlessMode from '../MonkeyPatchElectronHeadlessMode/MonkeyPatchElectronHeadlessMode.js'
import * as MonkeyPatchElectronScript from '../MonkeyPatchElectronScript/MonkeyPatchElectronScript.js'
import * as ScenarioFunctions from '../ScenarioFunctions/ScenarioFunctions.js'
import * as WaitForDebuggerToBePaused from '../WaitForDebuggerToBePaused/WaitForDebuggerToBePaused.js'

export const connectElectron = async (connectionId, headlessMode, webSocketUrl, isFirstConnection, isLocalVsCode) => {
  Assert.number(connectionId)
  Assert.boolean(headlessMode)
  Assert.string(webSocketUrl)
  Assert.boolean(isFirstConnection)
  Assert.boolean(isLocalVsCode)
  const electronIpc = await DebuggerCreateIpcConnection.createConnection(webSocketUrl)
  const electronRpc = DebuggerCreateRpcConnection.createRpc(electronIpc, isLocalVsCode)
  IntermediateConnectionState.set(connectionId, electronRpc)

  electronRpc.on(DevtoolsEventType.DebuggerPaused, ScenarioFunctions.handlePaused)
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
  })
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
  await DevtoolsProtocolDebugger.resume(electronRpc)
  return {
    monkeyPatchedElectron,
    electronObjectId,
    callFrameId,
  }
}
