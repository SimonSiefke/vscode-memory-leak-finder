import * as Assert from '../Assert/Assert.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

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

// TODO use page object
export const evaluateInUtilityContext = async (options: any, locator: any): Promise<any> => {
  const { rpc, utilityContext } = locator
  Assert.object(rpc)
  Assert.object(utilityContext)
  Assert.string(rpc.sessionId)
  const result = await DevtoolsProtocolRuntime.callFunctionOn(rpc, {
    ...options,
    ...getCallFunctionContextOptions(utilityContext),
  })
  return result
}
