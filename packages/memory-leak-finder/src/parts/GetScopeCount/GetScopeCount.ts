import * as GetFlatScopeList from '../GetFlatScopeList/GetFlatScopeList.ts'

export const getScopeCount = async (session, objectGroup) => {
  const flatScopeList = await GetFlatScopeList.getFlatScopeList(session, objectGroup)
  return flatScopeList.length
}
