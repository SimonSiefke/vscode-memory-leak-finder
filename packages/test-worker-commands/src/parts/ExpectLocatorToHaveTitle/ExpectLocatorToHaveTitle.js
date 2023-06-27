import * as DevtoolsProtocolRuntime from '../DevtoolsProtocolRuntime/DevtoolsProtocolRuntime.js'
import * as ExecutionContextState from '../ExecutionContextState/ExecutionContextState.js'
import { ExpectError } from '../ExpectError/ExpectError.js'
import * as SessionState from '../SessionState/SessionState.js'

/**
 * @param {string} expectedTitle
 */
export const toHaveTitle = async (expectedTitle) => {
  const pageSession = SessionState.getPageSession()
  if (!pageSession) {
    throw new Error('no page found')
  }
  console.log('wait for utility context', pageSession.sessionId)
  const utilityExecutionContext = await ExecutionContextState.waitForUtilityExecutionContext(pageSession.sessionId)
  console.log('got for utility context')
  if (!utilityExecutionContext) {
    throw new Error(`no utility execution context found`)
  }
  const title = await DevtoolsProtocolRuntime.evaluate(pageSession.rpc, {
    expression: `document.title`,
    uniqueContextId: utilityExecutionContext.uniqueId,
  })
  if (title !== expectedTitle) {
    throw new ExpectError(`expected page to have title ${expectedTitle} but was ${title}`)
  }
}
