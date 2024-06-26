import * as Assert from '../Assert/Assert.js'
import * as GetAllScopePropertiesInternal from '../GetAllScopePropertiesInternal/GetAllScopePropertiesInternal.js'

const getNewRemaining = (seen, newObjectIds) => {
  const newRemaining = []
  const seenSet = new Set(seen)
  for (const objectId of newObjectIds) {
    if (seenSet.has(objectId)) {
      continue
    }
    newRemaining.push(objectId)
  }
  return newRemaining
}

const getNewSeen = (seen, objectIds) => {
  return [...seen, ...objectIds]
}

const getNewAllScopeProperties = (allScopeProperties, scopeProperties) => {
  return [...allScopeProperties, ...scopeProperties]
}

export const getAllScopeProperties = async (session, objectGroup, objectIds) => {
  Assert.object(session)
  Assert.string(objectGroup)
  Assert.array(objectIds)
  let remaining = objectIds
  let seen = objectIds
  let allScopeProperties = []
  while (remaining.length > 0) {
    const newObjectIds = await GetAllScopePropertiesInternal.getAllScopeListPropertiesInternal(session, objectGroup, remaining)
    seen = getNewSeen(seen, newObjectIds)
    remaining = getNewRemaining(seen, newObjectIds)
    allScopeProperties = getNewAllScopeProperties(allScopeProperties, newObjectIds)
  }
  return allScopeProperties
}
