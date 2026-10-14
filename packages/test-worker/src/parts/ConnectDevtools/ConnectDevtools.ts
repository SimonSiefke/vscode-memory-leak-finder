import { addUtilityExecutionContext } from '../AddUtilityExecutionContext/AddUtilityExecutionContext.ts'
import * as Assert from '../Assert/Assert.ts'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import { DevtoolsProtocolPage } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { createPageObjectContext, createDefaultContext, createUtilityContext } from '../CreateTestContext/CreateTestContext.ts'
import * as DisableTimeouts from '../DisableTimeouts/DisableTimeouts.ts'
import * as ImportScript from '../ImportScript/ImportScript.ts'
import * as LivePage from '../LivePage/LivePage.ts'
import * as Page from '../Page/Page.ts'
import * as PageObjectState from '../PageObjectState/PageObjectState.ts'
import { waitForSession } from '../WaitForSession/WaitForSession.ts'

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

  const pageObjectContext = createPageObjectContext({
    browserRpc,
    electronObjectId,
    electronRpc,
    idleTimeout,
    page: firstWindow,
    sessionRpc,
    utilityContext,
    ideVersion: parsedIdeVersion,
    platform,
  })

  const livePage: any = LivePage.create({
    onRebind: async (nextPage) => {
      pageObjectContext.defaultContext = createDefaultContext(nextPage.sessionRpc, nextPage.utilityContext)
      pageObjectContext.page = livePage
      pageObjectContext.sessionRpc = nextPage.sessionRpc
      pageObjectContext.utilityContext = createUtilityContext(nextPage.sessionRpc, nextPage.utilityContext)
    },
    page: firstWindow,
  })
  pageObjectContext.page = livePage

  const electronApp = pageObjectContext.electronApp
  electronApp.rebind({ firstWindow: livePage, sessionRpc })
  pageObjectContext.reconnectDevtools = async () => {
    const reconnectTimeout = Math.min(attachedToPageTimeout, 5000)
    const { sessionId, sessionRpc, targetId } = await waitForSession(browserRpc, reconnectTimeout)
    const { frameTree } = await DevtoolsProtocolPage.getFrameTree(sessionRpc)
    const utilityContext = await addUtilityExecutionContext(sessionRpc, utilityExecutionContextName, frameTree.frame.id)
    const nextPage = Page.create({
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
    await livePage.rebind(nextPage)
    electronApp.rebind({
      firstWindow: livePage,
      sessionRpc,
    })
  }

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
