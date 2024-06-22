import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as ExecutionContextState from '../ExecutionContextState/ExecutionContextState.js'
import * as SessionState from '../SessionState/SessionState.js'

export const evaluateInUtilityContext = async (options, sessionId = '') => {
  if (!sessionId) {
    // TODO remove this code and make sessionId a required argument
    const pageSession = SessionState.getPageSession()
    if (!pageSession) {
      throw new Error('no page found')
    }
    sessionId = pageSession.sessionId
  }
  const pageSession = SessionState.getPageSessionById(sessionId)
  const utilityExecutionContext = await ExecutionContextState.waitForUtilityExecutionContext(sessionId)
  if (!utilityExecutionContext) {
    throw new Error(`no utility execution context found`)
  }
  const result = await DevtoolsProtocolRuntime.callFunctionOn(pageSession.rpc, {
    ...options,
    uniqueContextId: utilityExecutionContext.uniqueId,
  })
  return result
}
