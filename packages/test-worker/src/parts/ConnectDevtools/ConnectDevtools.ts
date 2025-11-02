import { addUtilityExecutionContext } from '../AddUtilityExecutionContext/AddUtilityExecutionContext.ts'
import * as Assert from '../Assert/Assert.ts'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import { DevtoolsProtocolPage, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as DisableTimeouts from '../DisableTimeouts/DisableTimeouts.ts'
import * as ElectronApp from '../ElectronApp/ElectronApp.ts'
import * as Expect from '../Expect/Expect.ts'
import * as ImportScript from '../ImportScript/ImportScript.ts'
import * as Page from '../Page/Page.ts'
import * as PageObjectState from '../PageObjectState/PageObjectState.ts'
import { VError } from '../VError/VError.ts'
import { waitForSession } from '../WaitForSession/WaitForSession.ts'

export const connectDevtools = async (
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
) => {
  Assert.number(connectionId)
  Assert.string(devtoolsWebSocketUrl)
  // TODO must create separate electron object id since it is a separate connection

  const [electronRpc, browserRpc] = await Promise.all([
    DebuggerCreateIpcConnection.createConnection(electronWebSocketUrl),
    DebuggerCreateIpcConnection.createConnection(devtoolsWebSocketUrl),
  ])
  const { sessionRpc, sessionId, targetId } = await waitForSession(browserRpc, attachedToPageTimeout)

  const { frameTree } = await DevtoolsProtocolPage.getFrameTree(sessionRpc)
  const frameId = frameTree.frame.id

  const utilityExecutionContextName = 'utility'
  const utilityContext = await addUtilityExecutionContext(sessionRpc, utilityExecutionContextName, frameId)

  const firstWindow = Page.create({
    electronObjectId,
    electronRpc,
    sessionId,
    targetId,
    rpc: sessionRpc,
    idleTimeout,
    utilityContext,
    browserRpc,
    sessionRpc,
  })

  const electronApp = ElectronApp.create({
    electronRpc,
    electronObjectId,
    idleTimeout,
    firstWindow,
    browserRpc,
    sessionRpc,
  })
  const pageObjectContext = {
    page: firstWindow,
    expect: Expect.expect,
    VError,
    electronApp,
    ideVersion: parsedIdeVersion,
    utilityContext: {
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
    },
    defaultContext: {
      callFunctionOn(options) {
        return DevtoolsProtocolRuntime.evaluate(sessionRpc, {
          ...options,
          uniqueContextId: utilityContext.uniqueId,
        })
      },
    },
    evaluateInUtilityContext(item) {},
    evaluateInDefaultContext(item) {
      throw new Error(`not implemented`)
    },
  }

  const pageObjectModule = await ImportScript.importScript(pageObjectPath)
  const pageObject = await pageObjectModule.create(pageObjectContext)
  PageObjectState.set(connectionId, pageObject, pageObjectContext)
  await pageObject.WaitForApplicationToBeReady.waitForApplicationToBeReady()
  if (timeouts === false) {
    // TODO this should be part of initialization worker
    await DisableTimeouts.disableTimeouts(firstWindow)
  }
}
