import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as ExecutionContextState from '../ExecutionContextState/ExecutionContextState.ts'
import { ExpectError } from '../ExpectError/ExpectError.ts'
import * as PTimeout from '../PTimeout/PTimeout.ts'

export const evaluate = async (rpc, { expression, awaitPromise = false, replMode = false }) => {
  try {
    const utilityExecutionContext = await ExecutionContextState.waitForUtilityExecutionContext(rpc.sessionId)
    const result = await PTimeout.pTimeout(
      DevtoolsProtocolRuntime.evaluate(rpc, {
        expression,
        returnByValue: true,
        generatePreview: true,
        awaitPromise,
        replMode,
        uniqueContextId: utilityExecutionContext.uniqueId,
      }),
      {
        milliseconds: 3000,
      },
    )
    return result
  } catch (error) {
    // @ts-ignore
    if (error && error.message === 'uniqueContextId not found') {
      throw new ExpectError(`Please wait for window to be loaded before evaluating, e.g. await expect(window).toBeLoaded()`)
    }
    throw error
  }
}
