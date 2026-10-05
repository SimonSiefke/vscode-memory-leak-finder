import * as Assert from '../Assert/Assert.ts'
import { ExpectError } from '../ExpectError/ExpectError.ts'
import * as PageObjectState from '../PageObjectState/PageObjectState.ts'
import { VError } from '../VError/VError.ts'

export interface IdleResult {
  readonly didTimeout: boolean
}

const NativeIdleTimeout = 1000
const TransportTimeout = 5000
let hasWarnedAboutIdleTimeout = false

const getExpression = (canUseIdleCallback) => {
  Assert.boolean(canUseIdleCallback)
  if (canUseIdleCallback) {
    return `await new Promise(resolve => {
  const callback = deadline => resolve(deadline.didTimeout)
  requestIdleCallback(callback, { timeout: ${NativeIdleTimeout} })
})`
  }
  return `await new Promise(resolve => {
  setTimeout(() => resolve(false), 16)
})`
}

const waitRpcIdle = (pageObject, canUseIdleCallback) => {
  const expression = getExpression(canUseIdleCallback)
  return pageObject.utilityContext.evaluate({
    awaitPromise: true,
    expression,
    generatePreview: true,
    replMode: true,
    returnByValue: true,
  })
}

const waitWithTransportWatchdog = async (promise) => {
  let timeout
  const timeoutPromise = new Promise((_, reject) => {
    timeout = globalThis.setTimeout(() => {
      reject(new Error(`renderer/CDP idle call timed out after ${TransportTimeout}ms`))
    }, TransportTimeout)
  })
  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    globalThis.clearTimeout(timeout)
  }
}

export const resetIdleTimeoutWarning = (): void => {
  hasWarnedAboutIdleTimeout = false
}

export const waitForIdle = async (rpc, canUseIdleCallback, _idleTimeout): Promise<IdleResult> => {
  try {
    const connectionId = 1
    const pageObject = PageObjectState.getPageObjectContext(connectionId)

    const didTimeout = await waitWithTransportWatchdog(waitRpcIdle(pageObject, canUseIdleCallback))
    if (didTimeout && !hasWarnedAboutIdleTimeout) {
      hasWarnedAboutIdleTimeout = true
      console.warn(`requestIdleCallback used its ${NativeIdleTimeout}ms timeout; continuing with a degraded scheduler yield`)
    }
    return {
      didTimeout: Boolean(didTimeout),
    }
  } catch (error) {
    // @ts-ignore
    if (error && error.message === 'uniqueContextId not found') {
      throw new ExpectError(`Please wait for window to be loaded before evaluating, e.g. await expect(window).toBeLoaded()`)
    }
    throw new VError(error, `Failed to check that page is idle`)
  }
}
