import type { Session } from '../Session/Session.ts'
import * as GetFlatScopeList from '../GetFlatScopeList/GetFlatScopeList.ts'

export const getScopeCount = async (session: Session, objectGroup: string) => {
  const flatScopeList = await GetFlatScopeList.getFlatScopeList(session, objectGroup)
  return flatScopeList.length
}
