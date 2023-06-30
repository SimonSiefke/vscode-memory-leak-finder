import * as DevtoolsProtocolRuntime from '../DevtoolsProtocolRuntime/DevtoolsProtocolRuntime.js'
import * as ExecutionContextState from '../ExecutionContextState/ExecutionContextState.js'
import * as SessionState from '../SessionState/SessionState.js'

export const checkMultiElementCondition = async (fnName, locator, options = {}) => {
  const pageSession = SessionState.getPageSession()
  if (!pageSession) {
    throw new Error('no page found')
  }

  const utilityExecutionContext = await ExecutionContextState.waitForUtilityExecutionContext(pageSession.sessionId)
  if (!utilityExecutionContext) {
    throw new Error(`no utility execution context found`)
  }
  await DevtoolsProtocolRuntime.callFunctionOn(pageSession.rpc, {
    functionDeclaration: '(locator, fnName, options) => test.checkMultiElementCondition(locator, fnName, options)',
    arguments: [
      {
        value: {
          selector: locator.selector,
          nth: -1,
          hasText: locator.hasText,
        },
      },
      {
        value: fnName,
      },
      {
        value: options,
      },
    ],
    executionContextId: utilityExecutionContext.id, // TODO move to uniqueid once supported
    // uniqueContextId: utilityExecutionContext.uniqueId,
    awaitPromise: true,
  })

  // TODO
}
