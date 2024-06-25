import * as Assert from '../Assert/Assert.js'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as ParseScopes from '../ParseScopes/ParseScopes.js'

export const getScopeListProperties = async (session, objectGroup, objectId) => {
  Assert.object(session)
  Assert.string(objectGroup)
  Assert.string(objectId)
  const fnResult1 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: objectId,
    ownProperties: true,
    generatePreview: false,
  })
  const scopes = ParseScopes.parseScopes(fnResult1)
  return scopes
}
