import { addUtilityExecutionContext } from '../AddUtilityExecutionContext/AddUtilityExecutionContext.ts'
import * as Assert from '../Assert/Assert.ts'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import { DevtoolsProtocolPage, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as DisableTimeouts from '../DisableTimeouts/DisableTimeouts.ts'
import * as ElectronApp from '../ElectronApp/ElectronApp.ts'
import * as Expect from '../Expect/Expect.ts'
import * as ImportScript from '../ImportScript/ImportScript.ts'
import * as LivePage from '../LivePage/LivePage.ts'
import * as Page from '../Page/Page.ts'
import * as PageObjectState from '../PageObjectState/PageObjectState.ts'
import { VError } from '../VError/VError.ts'
import { waitForSession } from '../WaitForSession/WaitForSession.ts'

const createDefaultContext = (sessionRpc, utilityContext) => {
  return {
    callFunctionOn(options) {
      return DevtoolsProtocolRuntime.evaluate(sessionRpc, {
        ...options,
        uniqueContextId: utilityContext.uniqueId,
      })
    },
  }
}

const createUtilityContext = (sessionRpc, utilityContext) => {
  return {
    callFunctionOn(options) {
      return DevtoolsProtocolRuntime.callFunctionOn(sessionRpc, {
        ...options,
        uniqueContextId: utilityContext.uniqueId,
      })
    },
    evaluate(options) {
      return DevtoolsProtocolRuntime.evaluate(sessionRpc, {
        ...options,
        uniqueContextId: utilityContext.uniqueId,
      })
    },
  }
}

export const connectDevtools = async (
  platform: string,
  connectionId: number,
  devtoolsWebSocketUrl: string,
  electronObjectId: string,
  electronWebSocketUrl: string,
  idleTimeout: number,
  pageObjectPath: string,
  parsedIdeVersion: any,
  timeouts: boolean,
  _utilityContext: any,
  attachedToPageTimeout: number,
  inspectSharedProcess: boolean,
  inspectExtensions: boolean,
  inspectPtyHost: boolean,
  enableExtensions: boolean,
  trackFunctions: boolean,
) => {
  Assert.number(connectionId)
  Assert.string(devtoolsWebSocketUrl)
  // TODO must create separate electron object id since it is a separate connection

  const [electronRpc, browserRpc] = await Promise.all([
    DebuggerCreateIpcConnection.createConnection(electronWebSocketUrl),
    DebuggerCreateIpcConnection.createConnection(devtoolsWebSocketUrl),
  ])
  const { sessionId, sessionRpc, targetId } = await waitForSession(browserRpc, attachedToPageTimeout)

  const { frameTree } = await DevtoolsProtocolPage.getFrameTree(sessionRpc)
  const frameId = frameTree.frame.id

  const utilityExecutionContextName = 'utility'
  const utilityContext = await addUtilityExecutionContext(sessionRpc, utilityExecutionContextName, frameId)

  const firstWindow = Page.create({
    browserRpc,
    electronObjectId,
    electronRpc,
    idleTimeout,
    rpc: sessionRpc,
    sessionId,
    sessionRpc,
    targetId,
    utilityContext,
  })

  const pageObjectContext = {
    browserRpc,
    defaultContext: createDefaultContext(sessionRpc, utilityContext),
    electronApp: undefined,
    evaluateInDefaultContext(item) {
      throw new Error(`not implemented`)
    },
    evaluateInUtilityContext(item) {},
    expect: Expect.expect,
    ideVersion: parsedIdeVersion,
    page: undefined,
    platform,
    sessionRpc,
    utilityContext: createUtilityContext(sessionRpc, utilityContext),
    VError,
  }

  const livePage = LivePage.create({
    onRebind: async (nextPage) => {
      pageObjectContext.defaultContext = createDefaultContext(nextPage.sessionRpc, nextPage.utilityContext)
      pageObjectContext.page = livePage
      pageObjectContext.sessionRpc = nextPage.sessionRpc
      pageObjectContext.utilityContext = createUtilityContext(nextPage.sessionRpc, nextPage.utilityContext)
    },
    page: firstWindow,
  })
  pageObjectContext.page = livePage

  const electronApp = ElectronApp.create({
    browserRpc,
    electronObjectId,
    electronRpc,
    firstWindow: livePage,
    idleTimeout,
    sessionRpc,
  })
  pageObjectContext.electronApp = electronApp

  const pageObjectModule = await ImportScript.importScript(pageObjectPath)
  const pageObject = await pageObjectModule.create(pageObjectContext)
  PageObjectState.set(connectionId, pageObject, pageObjectContext)

  await pageObject.WaitForApplicationToBeReady.waitForApplicationToBeReady({
    enableExtensions,
    inspectPtyHost,
  })
  if (timeouts === false) {
    // TODO this should be part of initialization worker
    await DisableTimeouts.disableTimeouts(firstWindow)
  }
}
