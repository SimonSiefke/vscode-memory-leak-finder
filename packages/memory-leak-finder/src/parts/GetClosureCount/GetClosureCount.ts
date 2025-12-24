import * as GetFlatScopeList from '../GetFlatScopeList/GetFlatScopeList.ts'
import * as IsClosure from '../IsClosure/IsClosure.ts'
import type { Session } from '../Session/Session.ts'

export const getClosureCount = async (session: Session, objectGroup: string) => {
  const flatScopeList = await GetFlatScopeList.getFlatScopeList(session, objectGroup)
  const closures = flatScopeList.filter(IsClosure.isClosure)
  const closureCount = closures.length
  return closureCount
}
