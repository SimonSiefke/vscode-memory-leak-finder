import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.js'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.js'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.js'
import * as DevtoolsProtocolDebugger from '../DevtoolsProtocolDebugger/DevtoolsProtocolDebugger.js'
import * as DevtoolsProtocolRuntime from '../DevtoolsProtocolRuntime/DevtoolsProtocolRuntime.js'
import * as DevtoolsProtocolTarget from '../DevtoolsProtocolTarget/DevtoolsProtocolTarget.js'
import * as ElectronApp from '../ElectronApp/ElectronApp.js'
import * as LaunchElectron from '../LaunchElectron/LaunchElectron.js'
import * as MonkeyPatchElectronScript from '../MonkeyPatchElectronScript/MonkeyPatchElectronScript.js'
import * as ObjectType from '../ObjectType/ObjectType.js'
import * as ScenarioFunctions from '../ScenarioFunctions/ScenarioFunctions.js'
import * as SessionState from '../SessionState/SessionState.js'
import * as WaitForDebuggerToBePaused from '../WaitForDebuggerToBePaused/WaitForDebuggerToBePaused.js'
import * as WaitForDevtoolsListening from '../WaitForDevtoolsListening/WaitForDevtoolsListening.js'

export const launch = async ({ cliPath, args, headlessMode, cwd }) => {
  const { child, webSocketUrl } = await LaunchElectron.launchElectron({ cliPath, args, headlessMode, cwd })
  const electronIpc = await DebuggerCreateIpcConnection.createConnection(webSocketUrl)
  const electronRpc = DebuggerCreateRpcConnection.createRpc(electronIpc)

  electronRpc.on(DevtoolsEventType.DebuggerPaused, ScenarioFunctions.handlePaused)
  electronRpc.on(DevtoolsEventType.DebuggerResumed, ScenarioFunctions.handleResumed)
  electronRpc.on(DevtoolsEventType.DebuggerScriptParsed, ScenarioFunctions.handleScriptParsed)
  electronRpc.on(DevtoolsEventType.RuntimeExecutionContextCreated, ScenarioFunctions.handleRuntimeExecutionContextCreated)
  electronRpc.on(DevtoolsEventType.RuntimeExecutionContextDestroyed, ScenarioFunctions.handleRuntimeExecutionContextDestroyed)

  await Promise.all([
    DevtoolsProtocolDebugger.enable(electronRpc),
    DevtoolsProtocolRuntime.enable(electronRpc),
    DevtoolsProtocolRuntime.runIfWaitingForDebugger(electronRpc),
  ])

  const msg = await WaitForDebuggerToBePaused.waitForDebuggerToBePaused(electronRpc)
  const callFrame = msg.params.callFrames[0]
  const callFrameId = callFrame.callFrameId

  const electron = await DevtoolsProtocolDebugger.evaluateOnCallFrame(electronRpc, {
    callFrameId,
    expression: `require('electron')`,
    generatePreview: true,
  })
  const electronObjectId = electron.result.result.objectId

  const monkeyPatchedElectron = await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
    functionDeclaration: MonkeyPatchElectronScript.monkeyPatchElectronScript,
    objectId: electronObjectId,
  })
  await DevtoolsProtocolDebugger.resume(electronRpc)

  const devtoolsUrl = await WaitForDevtoolsListening.waitForDevtoolsListening(child.stderr)

  const browserIpc = await DebuggerCreateIpcConnection.createConnection(devtoolsUrl)
  const browserRpc = DebuggerCreateRpcConnection.createRpc(browserIpc)

  SessionState.addSession('browser', {
    type: ObjectType.Browser,
    objectType: ObjectType.Browser,
    url: '',
    sessionId: '',
    rpc: browserRpc,
  })

  browserRpc.on(DevtoolsEventType.DebuggerPaused, ScenarioFunctions.handlePaused)
  browserRpc.on(DevtoolsEventType.DebuggerResumed, ScenarioFunctions.handleResumed)
  browserRpc.on(DevtoolsEventType.PageFrameNavigated, ScenarioFunctions.handlePageFrameNavigated)
  browserRpc.on(DevtoolsEventType.PageLifeCycleEvent, ScenarioFunctions.handlePageLifeCycleEvent)
  browserRpc.on(DevtoolsEventType.PageLoadEventFired, ScenarioFunctions.handlePageLoadEventFired)
  browserRpc.on(DevtoolsEventType.RuntimeExecutionContextCreated, ScenarioFunctions.handleRuntimeExecutionContextCreated)
  browserRpc.on(DevtoolsEventType.RuntimeExecutionContextDestroyed, ScenarioFunctions.handleRuntimeExecutionContextDestroyed)
  browserRpc.on(DevtoolsEventType.RuntimeExecutionContextsCleared, ScenarioFunctions.handleRuntimeExecutionContextsCleared)
  browserRpc.on(DevtoolsEventType.TargetAttachedToTarget, ScenarioFunctions.handleAttachedToTarget)
  browserRpc.on(DevtoolsEventType.TargetDetachedFromTarget, ScenarioFunctions.handleDetachedFromTarget)
  browserRpc.on(DevtoolsEventType.TargetTargetCrashed, ScenarioFunctions.handleTargetCrashed)
  browserRpc.on(DevtoolsEventType.TargetTargetCreated, ScenarioFunctions.handleTargetCreated)
  browserRpc.on(DevtoolsEventType.TargetTargetDestroyed, ScenarioFunctions.handleTargetDestroyed)
  browserRpc.on(DevtoolsEventType.TargetTargetInfoChanged, ScenarioFunctions.handleTargetInfoChanged)

  await Promise.all([
    DevtoolsProtocolTarget.setAutoAttach(browserRpc, {
      autoAttach: true,
      waitForDebuggerOnStart: true,
      flatten: true,
    }),
    DevtoolsProtocolTarget.setDiscoverTargets(browserRpc, {
      discover: true,
    }),
  ])

  const result = await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
    functionDeclaration: MonkeyPatchElectronScript.undoMonkeyPatch,
    objectId: monkeyPatchedElectron.objectId,
  })

  return ElectronApp.create({
    electronRpc,
    electronObjectId,
    callFrameId,
  })
}
