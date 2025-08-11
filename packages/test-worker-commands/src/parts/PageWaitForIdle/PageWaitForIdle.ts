import * as Assert from '../Assert/Assert.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as ExecutionContextState from '../ExecutionContextState/ExecutionContextState.ts'
import { ExpectError } from '../ExpectError/ExpectError.ts'
import * as PTimeout from '../PTimeout/PTimeout.ts'
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
      milliseconds: 5000,
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
