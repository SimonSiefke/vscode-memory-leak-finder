import type { Dynamic } from '../Types/Types.ts'
import type { Session } from '../Session/Session.ts'
import * as Assert from '../Assert/Assert.ts'
import * as GetAllScopePropertiesInternal from '../GetAllScopePropertiesInternal/GetAllScopePropertiesInternal.ts'
const getNewRemaining = (seen: Dynamic, newObjectIds: Dynamic) => {
  const newRemaining: Dynamic[] = []
  const seenSet = new Set(seen)
  for (const objectId of newObjectIds) {
    if (seenSet.has(objectId)) {
      continue
    }
    newRemaining.push(objectId)
  }
  return newRemaining
}
const getNewSeen = (seen: Dynamic, objectIds: Dynamic) => {
  return [...seen, ...objectIds]
}
const getNewAllScopeProperties = (allScopeProperties: Dynamic, scopeProperties: Dynamic) => {
  return [...allScopeProperties, ...scopeProperties]
}
export const getAllScopeProperties = async (session: Session, objectGroup: string, objectIds: readonly Dynamic[]) => {
  Assert.object(session)
  Assert.string(objectGroup)
  Assert.array(objectIds)
  let remaining = objectIds
  let seen = objectIds
  let allScopeProperties: Dynamic[] = []
  while (remaining.length > 0) {
    const newObjectIds = await GetAllScopePropertiesInternal.getAllScopeListPropertiesInternal(session, objectGroup, remaining)
    seen = getNewSeen(seen, newObjectIds)
    remaining = getNewRemaining(seen, newObjectIds)
    allScopeProperties = getNewAllScopeProperties(allScopeProperties, newObjectIds)
  }
  return allScopeProperties
}
