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
import * as IsPausedOnStartEvent from '../IsPausedOnStartEvent/IsPausedOnStartEvent.js'

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
    // since electron 29, electron cause pause again during connecting
    if (IsPausedOnStartEvent.isPausedOnStartEvent(x)) {
      await DevtoolsProtocolDebugger.resume(electronRpc)
      return
    }
    console.log('intermediate paused due to' + JSON.stringify(x.params.reason, null, 2).slice(0, 100))
  }

  electronRpc.on(DevtoolsEventType.DebuggerPaused, handleIntermediatePaused)
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
  // if (headlessMode) {
  //   await DevtoolsProtocolDebugger.evaluateOnCallFrame(electronRpc, {
  //     callFrameId,
  //     expression: MonkeyPatchElectronHeadlessMode.monkeyPatchElectronScript,
  //   })
  // }
  // const monkeyPatchedElectron = await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
  //   functionDeclaration: MonkeyPatchElectronScript.monkeyPatchElectronScript,
  //   objectId: electronObjectId,
  // })
  await DevtoolsProtocolDebugger.resume(electronRpc)
  await DevtoolsProtocolRuntime.runIfWaitingForDebugger(electronRpc)

  console.log('resume')

  //   const s = await DevtoolsProtocolRuntime.evaluate(electronRpc, {
  //     expression: `(async () => {
  //   const {app} = require('electron'); process.exit = ()=>{console.log('exit prevented')}; app.emit = () => {console.log('emit')}; app.quit = ()=>{console.log('quit prevented')}; await app.whenReady();const {BrowserWindow}=require('electron');const win = new BrowserWindow({}); win.show()
  // })()
  //       `,
  //     generatePreview: true,
  //     includeCommandLineAPI: true,
  //     awaitPromise: true,
  //   })
  // console.log({ s })
  return {
    monkeyPatchedElectron: {},
    electronObjectId,
    callFrameId,
  }
}
