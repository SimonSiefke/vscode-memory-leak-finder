import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as Assert from '../Assert/Assert.ts'

// TODO use page object
export const evaluateInUtilityContext = async (options: any, locator: any): Promise<any> => {
  const { rpc, utilityContext } = locator
  console.log(options)
  console.log(rpc)
  Assert.object(rpc)
  Assert.object(utilityContext)
  Assert.string(utilityContext.uniqueId)
  Assert.string(rpc.sessionId)
  const result = await DevtoolsProtocolRuntime.callFunctionOn(rpc, {
    ...options,
    uniqueContextId: utilityContext.uniqueId,
  })
  return result
}

export const evaluateInDefaultContext = async (options: any, sessionId: any = ''): Promise<any> => {
  throw new Error(`not implemented`)
}
