import * as Assert from '../Assert/Assert.ts'
import { connectElectron } from '../ConnectElectron/ConnectElectron.ts'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import { DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as DisableTimeouts from '../DisableTimeouts/DisableTimeouts.ts'
import * as ElectronApp from '../ElectronApp/ElectronApp.ts'
import * as Expect from '../Expect/Expect.ts'
import * as ImportScript from '../ImportScript/ImportScript.ts'
import * as ObjectType from '../ObjectType/ObjectType.ts'
import * as PageObjectState from '../PageObjectState/PageObjectState.ts'
import * as ScenarioFunctions from '../ScenarioFunctions/ScenarioFunctions.ts'
import * as SessionState from '../SessionState/SessionState.ts'
import { VError } from '../VError/VError.ts'
import * as WaitForFirstWindow from '../WaitForFirstWindow/WaitForFirstWindow.ts'

export const connectDevtools = async (
  connectionId: number,
  devtoolsWebSocketUrl: string,
  electronObjectId: string,
  isFirstConnection: boolean,
  headlessMode: boolean,
  webSocketUrl: string,
  canUseIdleCallback: boolean,
  idleTimeout: number,
  pageObjectPath: string,
  isHeadless: boolean,
  parsedIdeVersion: any,
  timeouts: boolean,
) => {
  Assert.number(connectionId)
  Assert.string(devtoolsWebSocketUrl)
  Assert.boolean(isFirstConnection)

  const electronRpc = await connectElectron(connectionId, headlessMode, webSocketUrl, isFirstConnection, canUseIdleCallback)
  const browserIpc = await DebuggerCreateIpcConnection.createConnection(devtoolsWebSocketUrl)
  // @ts-ignore
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
  const electronApp = ElectronApp.create({
    electronRpc,
    electronObjectId,
    idleTimeout,
  })
  const pageObjectModule = await ImportScript.importScript(pageObjectPath)
  const firstWindow = await WaitForFirstWindow.waitForFirstWindow({
    electronApp,
    isFirstConnection,
    isHeadless,
  })
  const pageObjectContext = {
    page: firstWindow,
    expect: Expect.expect,
    VError,
    electronApp,
    ideVersion: parsedIdeVersion,
  }
  const pageObject = await pageObjectModule.create(pageObjectContext)
  await pageObject.WaitForApplicationToBeReady.waitForApplicationToBeReady()
  if (timeouts === false) {
    await DisableTimeouts.disableTimeouts(firstWindow)
  }
  PageObjectState.set(connectionId, pageObject)
}
