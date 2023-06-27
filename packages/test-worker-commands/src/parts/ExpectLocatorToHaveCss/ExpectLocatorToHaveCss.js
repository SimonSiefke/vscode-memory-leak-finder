import * as DevtoolsProtocolRuntime from '../DevtoolsProtocolRuntime/DevtoolsProtocolRuntime.js'
import * as ExecutionContextState from '../ExecutionContextState/ExecutionContextState.js'
import * as SessionState from '../SessionState/SessionState.js'

export const toHaveCss = async (locator, key, value) => {
  const session = SessionState.getSession(locator.sessionId)
  const rpc = session.rpc
  const executionContext = await ExecutionContextState.waitForUtilityExecutionContext(locator.sessionId)
  const response = await DevtoolsProtocolRuntime.callFunctionOn(rpc, {
    functionDeclaration: '(locator, fnName, options) => test.checkSingleElementCondition(locator, fnName, options)',
    arguments: [
      {
        value: {
          selector: locator.selector,
        },
      },
      {
        value: 'toHaveCss',
      },
      {
        value: {
          key,
          value,
        },
      },
    ],
    uniqueContextId: executionContext.uniqueId,
    awaitPromise: true,
  })
}
