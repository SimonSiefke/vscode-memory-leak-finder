import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
// import * as ExecutionContextState from '../ExecutionContextState/ExecutionContextState.ts'

export const toHaveTitle = async (page, expectedTitle) => {
  const utilityExecutionContext = await ExecutionContextState.waitForUtilityExecutionContext(page.sessionId)
  // @ts-ignore
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
