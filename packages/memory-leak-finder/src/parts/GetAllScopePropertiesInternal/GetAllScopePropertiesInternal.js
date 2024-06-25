import * as Assert from '../Assert/Assert.js'
import * as GetScopeProperties from '../GetScopeProperties/GetScopeProperties.js'

const isDefined = (value) => {
  return value !== ''
}

export const getAllScopeListPropertiesInternal = async (session, objectGroup, objectIds) => {
  Assert.object(session)
  Assert.string(objectGroup)
  Assert.array(objectIds)
  const promises = []
  for (const objectId of objectIds) {
    promises.push(GetScopeProperties.getScopeListProperties(session, objectGroup, objectId))
  }
  const scopeProperties = await Promise.all(promises)
  const actualScopeProperties = scopeProperties.filter(isDefined)
  return actualScopeProperties
}
