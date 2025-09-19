// import * as ExecutionContextState from '../ExecutionContextState/ExecutionContextState.ts'
import { ExpectError } from '../ExpectError/ExpectError.ts'
import * as PTimeout from '../PTimeout/PTimeout.ts'
import * as PageObjectState from '../PageObjectState/PageObjectState.ts'

export const evaluate = async (rpc, { expression, awaitPromise = false, replMode = false }) => {
  try {
    const connectionId = 1
    const pageObject = PageObjectState.getPageObjectContext(connectionId)
    const result = await PTimeout.pTimeout(
      pageObject.utilityContext.evaluate({
        expression,
        returnByValue: true,
        generatePreview: true,
        awaitPromise,
        replMode,
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
