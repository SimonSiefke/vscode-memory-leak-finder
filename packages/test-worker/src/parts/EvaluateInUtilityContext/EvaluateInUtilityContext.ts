import * as Assert from '../Assert/Assert.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as UtilityScript from '../UtilityScript/UtilityScript.ts'

const getCallFunctionContextOptions = (utilityContext: { id?: number; uniqueId?: string }) => {
  if (utilityContext.uniqueId) {
    return {
      uniqueContextId: utilityContext.uniqueId,
    }
  }
  return {
    executionContextId: utilityContext.id,
  }
}

const getEvaluateContextOptions = (utilityContext: { id?: number; uniqueId?: string }) => {
  if (utilityContext.uniqueId) {
    return {
      uniqueContextId: utilityContext.uniqueId,
    }
  }
  return {
    contextId: utilityContext.id,
  }
}

// TODO use page object
export const evaluateInUtilityContext = async (options: any, locator: any): Promise<any> => {
  const { rpc, utilityContext } = locator
  Assert.object(rpc)
  Assert.object(utilityContext)
  Assert.string(rpc.sessionId)
  try {
    const result = await DevtoolsProtocolRuntime.callFunctionOn(rpc, {
      ...options,
      ...getCallFunctionContextOptions(utilityContext),
    })
    return result
  } catch (error) {
    if (error && String(error.message || error).includes('test is not defined')) {
      const utilityScript = await UtilityScript.getUtilityScript()
      await DevtoolsProtocolRuntime.evaluate(rpc, {
        expression: utilityScript,
        ...getEvaluateContextOptions(utilityContext),
      })
      return DevtoolsProtocolRuntime.callFunctionOn(rpc, {
        ...options,
        ...getCallFunctionContextOptions(utilityContext),
      })
    }
    throw error
  }
}
