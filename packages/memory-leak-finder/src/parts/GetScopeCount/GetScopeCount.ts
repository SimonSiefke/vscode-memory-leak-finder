import * as GetFlatScopeList from '../GetFlatScopeList/GetFlatScopeList.ts'
import type { Session } from '../Session/Session.ts'

export const getScopeCount = async (session: Session, objectGroup: string) => {
  const flatScopeList = await GetFlatScopeList.getFlatScopeList(session, objectGroup)
  return flatScopeList.length
}
