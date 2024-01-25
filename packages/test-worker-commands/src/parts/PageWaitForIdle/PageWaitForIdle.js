import * as Assert from '../Assert/Assert.js'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as ExecutionContextState from '../ExecutionContextState/ExecutionContextState.js'
import { ExpectError } from '../ExpectError/ExpectError.js'
import * as PTimeout from '../PTimeout/PTimeout.js'
import { VError } from '../VError/VError.js'

const getExpression = (canUseIdleCallback) => {
  Assert.boolean(canUseIdleCallback)
  if (canUseIdleCallback) {
    return `await new Promise(resolve => {
    requestIdleCallback(resolve)
    })`
  }
  return `await new Promise(resolve => {
setTimeout(resolve, 1)
})`
}

const waitRpcIdle = (rpc, uniqueId, canUseIdleCallback) => {
  const expression = getExpression(canUseIdleCallback)
  return DevtoolsProtocolRuntime.evaluate(rpc, {
    awaitPromise: true,
    replMode: true,
    expression,
    returnByValue: true,
    generatePreview: true,
    uniqueContextId: uniqueId,
  })
}

export const waitForIdle = async (rpc, canUseIdleCallback) => {
  try {
    const utilityExecutionContext = await ExecutionContextState.waitForUtilityExecutionContext(rpc.sessionId)
    const result = await PTimeout.pTimeout(waitRpcIdle(rpc, utilityExecutionContext.uniqueId, canUseIdleCallback), {
      milliseconds: 30000,
    })
    return result
  } catch (error) {
    if (error && error.message === 'uniqueContextId not found') {
      throw new ExpectError(`Please wait for window to be loaded before evaluating, e.g. await expect(window).toBeLoaded()`)
    }
    throw new VError(error, `Failed to check that page is idle`)
  }
}
