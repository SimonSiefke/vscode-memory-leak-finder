import * as Assert from '../Assert/Assert.js'
import * as DevtoolsProtocolRuntime from '../DevtoolsProtocolRuntime/DevtoolsProtocolRuntime.js'
import * as ExecutionContextState from '../ExecutionContextState/ExecutionContextState.js'
import * as SessionState from '../SessionState/SessionState.js'

export const type = async (locator, text) => {
  Assert.object(locator)
  Assert.string(text)
  const pageSession = SessionState.getPageSession()
  if (!pageSession) {
    throw new Error('no page found')
  }
  const utilityExecutionContext = await ExecutionContextState.waitForUtilityExecutionContext(pageSession.sessionId)
  if (!utilityExecutionContext) {
    throw new Error(`no utility execution context found`)
  }
  await DevtoolsProtocolRuntime.callFunctionOn(pageSession.rpc, {
    functionDeclaration: '(locator, fnName, options) => test.performAction(locator, fnName, options)',
    arguments: [
      {
        value: locator,
      },
      {
        value: 'type',
      },
      {
        value: {
          text,
        },
      },
    ],
    executionContextId: utilityExecutionContext.id, // TODO move to uniqueid once supported
    // uniqueContextId: utilityExecutionContext.uniqueId,
    awaitPromise: true,
  })
}
