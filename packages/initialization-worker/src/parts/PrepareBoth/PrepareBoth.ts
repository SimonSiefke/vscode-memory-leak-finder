import { connectElectron } from '../ConnectElectron/ConnectElectron.ts'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import { DevtoolsProtocolDebugger, DevtoolsProtocolRuntime, DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as Disposables from '../Disposables/Disposables.ts'
import * as LaunchIde from '../LaunchIde/LaunchIde.ts'
import * as MonkeyPatchElectronScript from '../MonkeyPatchElectronScript/MonkeyPatchElectronScript.ts'
import * as ScenarioFunctions from '../ScenarioFunctions/ScenarioFunctions.ts'
import * as WaitForDevtoolsListening from '../WaitForDevtoolsListening/WaitForDevtoolsListening.ts'

export const prepareBoth = async (headlessMode, cwd, ide, vscodePath, commit, connectionId, isFirstConnection, canUseIdleCallback) => {
  const { child, webSocketUrl, parsedVersion } = await LaunchIde.launchIde({
    headlessMode,
    cwd,
    ide,
    vscodePath,
    commit,
    addDisposable: Disposables.add,
  })
  const devtoolsWebSocketUrlPromise = WaitForDevtoolsListening.waitForDevtoolsListening(child.stderr)

  const electronIpc = await DebuggerCreateIpcConnection.createConnection(webSocketUrl)
  const electronRpc = DebuggerCreateRpcConnection.createRpc(electronIpc, canUseIdleCallback)

  const { monkeyPatchedElectronId, electronObjectId } = await connectElectron(electronRpc)

  await DevtoolsProtocolDebugger.resume(electronRpc)

  const devtoolsWebSocketUrl = await devtoolsWebSocketUrlPromise

  const browserIpc = await DebuggerCreateIpcConnection.createConnection(devtoolsWebSocketUrl)
  const browserRpc = DebuggerCreateRpcConnection.createRpc(browserIpc, true)

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
  // await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
  //   functionDeclaration: MonkeyPatchElectronScript.undoMonkeyPatch,
  //   objectId: monkeyPatchedElectronId,
  // })

  // TODO can probably dispose this electron rpc at this point

  // TODO start workers before connecting
  // TODO connect workers in parallel
  // TODO maybe pause again at this point, ensuring workers can connect correctly
  return {
    webSocketUrl,
    devtoolsWebSocketUrl,
    monkeyPatchedElectronId,
    electronObjectId,
    childPid: child.pid,
    parsedVersion,
  }
}

export const undoMonkeyPatch = async () => {
  // TODO avoid global variables
  // @ts-ignore
  const { electronRpc } = globalThis
  // @ts-ignore
  const { monkeyPatchedElectronId } = globalThis
  await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
    functionDeclaration: MonkeyPatchElectronScript.undoMonkeyPatch,
    objectId: monkeyPatchedElectronId,
  })
}
