// import * as ExecutionContextState from '../ExecutionContextState/ExecutionContextState.ts'
import { ExpectError } from '../ExpectError/ExpectError.ts'
import * as PageObjectState from '../PageObjectState/PageObjectState.ts'
import * as PTimeout from '../PTimeout/PTimeout.ts'

export const evaluate = async (rpc, { awaitPromise = false, expression, replMode = false }) => {
  try {
    const connectionId = 1
    const pageObject = PageObjectState.getPageObjectContext(connectionId)
    const result = await PTimeout.pTimeout(
      pageObject.utilityContext.evaluate({
        awaitPromise,
        expression,
        generatePreview: true,
        replMode,
        returnByValue: true,
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
