import type { Session } from '../Session/Session.ts'
import * as Assert from '../Assert/Assert.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as ParseFunctionScopeListProperty from '../ParseFunctionScopeListProperty/ParseFunctionScopeListProperty.ts'

export const getFunctionScopeProperty = async (session: Session, objectGroup, objectId) => {
  Assert.object(session)
  Assert.string(objectGroup)
  Assert.string(objectId)
  const fnResult1 = await DevtoolsProtocolRuntime.getProperties(session, {
    generatePreview: false,
    objectId: objectId,
    ownProperties: true,
  })
  const scopeListObjectId = ParseFunctionScopeListProperty.parseFunctionScopeListProperty(fnResult1)
  return scopeListObjectId
}
