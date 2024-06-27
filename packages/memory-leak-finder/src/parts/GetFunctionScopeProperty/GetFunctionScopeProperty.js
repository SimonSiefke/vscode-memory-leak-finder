import * as Assert from '../Assert/Assert.js'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as ParseFunctionScopeListProperty from '../ParseFunctionScopeListProperty/ParseFunctionScopeListProperty.js'

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
