import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as ExecutionContextState from '../ExecutionContextState/ExecutionContextState.js'
import * as SessionState from '../SessionState/SessionState.js'

export const evaluateInUtilityContext = async (options) => {
  const pageSession = SessionState.getPageSession()
  if (!pageSession) {
    throw new Error('no page found')
  }
  const utilityExecutionContext = await ExecutionContextState.waitForUtilityExecutionContext(pageSession.sessionId)
  if (!utilityExecutionContext) {
    throw new Error(`no utility execution context found`)
  }
  const result = await DevtoolsProtocolRuntime.callFunctionOn(pageSession.rpc, {
    ...options,
    executionContextId: utilityExecutionContext.id, // TODO move to uniqueid once supported
    // uniqueContextId: utilityExecutionContext.uniqueId,
  })
  return result
}
