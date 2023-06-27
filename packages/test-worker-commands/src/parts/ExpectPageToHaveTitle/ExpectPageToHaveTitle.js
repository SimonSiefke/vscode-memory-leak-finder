import * as DevtoolsProtocolRuntime from '../DevtoolsProtocolRuntime/DevtoolsProtocolRuntime.js'
import * as ExecutionContextState from '../ExecutionContextState/ExecutionContextState.js'

export const toHaveTitle = async (page, expectedTitle) => {
  const utilityExecutionContext = await ExecutionContextState.waitForUtilityExecutionContext(page.sessionId)
  const actualTitle = await DevtoolsProtocolRuntime.callFunctionOn(page.rpc, {
    functionDeclaration: '(expectedTitle) => test.checkTitle(expectedTitle)',
    uniqueContextId: utilityExecutionContext.uniqueId,
    awaitPromise: true,
    returnByValue: true,
    arguments: [
      {
        value: expectedTitle,
      },
    ],
  })
}
