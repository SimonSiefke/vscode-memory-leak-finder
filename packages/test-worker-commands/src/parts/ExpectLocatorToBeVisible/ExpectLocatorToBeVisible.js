import * as DevtoolsProtocolRuntime from '../DevtoolsProtocolRuntime/DevtoolsProtocolRuntime.js'
import * as ExecutionContextState from '../ExecutionContextState/ExecutionContextState.js'
import * as SessionState from '../SessionState/SessionState.js'

export const toBeVisible = async () => {
  const pageSession = SessionState.getPageSession()
  if (!pageSession) {
    throw new Error('no page found')
  }

  const utilityExecutionContext = await ExecutionContextState.waitForUtilityExecutionContext(pageSession.sessionId)
  if (!utilityExecutionContext) {
    throw new Error(`no utility execution context found`)
  }
  const html = await DevtoolsProtocolRuntime.evaluate(pageSession.rpc, {
    expression: `document.getElementById('SideBar').style.background="red"`,
    uniqueContextId: utilityExecutionContext.uniqueId,
  })
  // TODO
}
