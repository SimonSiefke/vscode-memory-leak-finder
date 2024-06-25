import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as Assert from '../Assert/Assert.js'

const getScopeProperties = async (session, objectGroup, objectId) => {
  Assert.object(session)
  Assert.string(objectGroup)
  Assert.string(objectId)
  const fnResult1 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: objectId,
    ownProperties: true,
    generatePreview: false,
  })
  return fnResult1.result
}

export const getAllScopeProperties = async (session, objectGroup, objectIds) => {
  Assert.object(session)
  Assert.string(objectGroup)
  Assert.array(objectIds)
  const promises = []
  for (const objectId of objectIds) {
    promises.push(getScopeProperties(session, objectGroup, objectId))
  }
  const scopeProperties = await Promise.all(promises)
  return scopeProperties
}
