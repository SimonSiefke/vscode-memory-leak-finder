import * as Assert from '../Assert/Assert.ts'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
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
  webSocketUrl: string,
  idleTimeout: number,
  pageObjectPath: string,
  parsedIdeVersion: any,
  timeouts: boolean,
  utilityContext: any,
) => {
  Assert.number(connectionId)
  Assert.string(devtoolsWebSocketUrl)
  Assert.object(utilityContext)

  const [electronRpc, browserRpc] = await Promise.all([
    DebuggerCreateIpcConnection.createConnection(webSocketUrl),
    DebuggerCreateIpcConnection.createConnection(devtoolsWebSocketUrl),
  ])
  const { sessionRpc, sessionId, targetId } = await waitForSession(browserRpc, 5000)
  const firstWindow = Page.create({
    electronObjectId,
    electronRpc,
    sessionId,
    targetId,
    rpc: sessionRpc,
    idleTimeout,
    utilityContext,
  })

  const electronApp = ElectronApp.create({
    electronRpc,
    electronObjectId,
    idleTimeout,
    firstWindow,
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
