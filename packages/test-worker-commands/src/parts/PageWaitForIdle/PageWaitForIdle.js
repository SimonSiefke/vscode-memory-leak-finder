import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as ExecutionContextState from '../ExecutionContextState/ExecutionContextState.js'
import { ExpectError } from '../ExpectError/ExpectError.js'
import * as PTimeout from '../PTimeout/PTimeout.js'
import { VError } from '../VError/VError.js'

export const waitForIdle = async (rpc) => {
  try {
    const utilityExecutionContext = await ExecutionContextState.waitForUtilityExecutionContext(rpc.sessionId)
    const result = await PTimeout.pTimeout(
      DevtoolsProtocolRuntime.evaluate(rpc, {
        awaitPromise: true,
        replMode: true,
        expression: `await new Promise(resolve => {
          requestIdleCallback(resolve)
        })`,
        returnByValue: true,
        generatePreview: true,
        uniqueContextId: utilityExecutionContext.uniqueId,
      }),
      {
        milliseconds: 15000,
      },
    )
    return result
  } catch (error) {
    if (error && error.message === 'uniqueContextId not found') {
      throw new ExpectError(`Please wait for window to be loaded before evaluating, e.g. await expect(window).toBeLoaded()`)
    }
    throw new VError(error, `Failed to check that page is idle`)
  }
}
