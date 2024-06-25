import * as Assert from '../Assert/Assert.js'
import * as GetScopeProperties from '../GetScopeProperties/GetScopeProperties.js'

export const getAllScopePropertiesInternal = async (session, objectGroup, objectIds) => {
  Assert.object(session)
  Assert.string(objectGroup)
  Assert.array(objectIds)
  const promises = []
  for (const objectId of objectIds) {
    promises.push(GetScopeProperties.getScopeProperties(session, objectGroup, objectId))
  }
  const scopeProperties = await Promise.all(promises)
  return scopeProperties
}
