import * as Assert from '../Assert/Assert.ts'
import { ExpectError } from '../ExpectError/ExpectError.ts'
import * as PTimeout from '../PTimeout/PTimeout.ts'
import * as PageObjectState from '../PageObjectState/PageObjectState.ts'
import { VError } from '../VError/VError.ts'

const getExpression = (canUseIdleCallback) => {
  Assert.boolean(canUseIdleCallback)
  if (canUseIdleCallback) {
    return `await new Promise(resolve => {
  requestIdleCallback(resolve)
})`
  }
  return `await new Promise(resolve => {
  setTimeout(resolve, 16)
})`
}

const waitRpcIdle = (pageObject, canUseIdleCallback) => {
  const expression = getExpression(canUseIdleCallback)
  return pageObject.utilityContext.evaluate({
    awaitPromise: true,
    replMode: true,
    expression,
    returnByValue: true,
    generatePreview: true,
  })
}

export const waitForIdle = async (rpc, canUseIdleCallback, idleTimeout) => {
  try {
    const connectionId = 1
    const pageObject = PageObjectState.getPageObjectContext(connectionId)

    const result = await PTimeout.pTimeout(waitRpcIdle(pageObject, canUseIdleCallback), {
      milliseconds: idleTimeout,
    })
    return result
  } catch (error) {
    // @ts-ignore
    if (error && error.message === 'uniqueContextId not found') {
      throw new ExpectError(`Please wait for window to be loaded before evaluating, e.g. await expect(window).toBeLoaded()`)
    }
    throw new VError(error, `Failed to check that page is idle`)
  }
}
