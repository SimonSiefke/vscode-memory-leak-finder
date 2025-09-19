import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
// import * as ExecutionContextState from '../ExecutionContextState/ExecutionContextState.ts'
// import * as SessionState from '../SessionState/SessionState.ts'
import * as PageObjectState from '../PageObjectState/PageObjectState.ts'

// TODO use page object
export const evaluateInUtilityContext = async (options: any, sessionId: any = ''): Promise<any> => {
  const connectionId = 1
  const pageObject = PageObjectState.getPageObject(connectionId)
  const result = await pageObject.evaluateInUtilityContext(options)
  return result
}

export const evaluateInDefaultContext = async (options: any, sessionId: any = ''): Promise<any> => {
  if (!sessionId) {
    // TODO remove this code and make sessionId a required argument
    const pageSession = SessionState.getPageSession()
    if (!pageSession) {
      throw new Error('no page found')
    }
    sessionId = pageSession.sessionId
  }
  const pageSession: any = SessionState.getPageSessionById(sessionId)
  const executionContext: any = await ExecutionContextState.waitForDefaultExecutionContext(sessionId)
  if (!executionContext) {
    throw new Error(`no default execution context found`)
  }
  const result = await DevtoolsProtocolRuntime.callFunctionOn(pageSession.rpc, {
    ...options,
    uniqueContextId: executionContext.uniqueId,
  })
  return result
}
