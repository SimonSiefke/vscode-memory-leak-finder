import * as Assert from '../Assert/Assert.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as ParseFunctionScopeListProperty from '../ParseFunctionScopeListProperty/ParseFunctionScopeListProperty.ts'

export const getFunctionScopeProperty = async (session, objectGroup, objectId) => {
  Assert.object(session)
  Assert.string(objectGroup)
  Assert.string(objectId)
  const fnResult1 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: objectId,
    ownProperties: true,
    generatePreview: false,
  })
  const scopeListObjectId = ParseFunctionScopeListProperty.parseFunctionScopeListProperty(fnResult1)
  return scopeListObjectId
}
