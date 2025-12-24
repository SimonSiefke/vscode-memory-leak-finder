import * as GetFlatScopeList from '../GetFlatScopeList/GetFlatScopeList.ts'
import type { Session } from '../Session/Session.ts'

const getScopeMap = (flatScopeMap) => {
  const counts = Object.create(null)
  for (const item of flatScopeMap) {
    counts[item.description] ||= 0
    counts[item.description]++
  }
  return counts
}

export const getScopes = async (session: Session, objectGroup: string) => {
  const flatScopeList = await GetFlatScopeList.getFlatScopeList(session, objectGroup)
  const scopeMap = getScopeMap(flatScopeList)
  return scopeMap
}
