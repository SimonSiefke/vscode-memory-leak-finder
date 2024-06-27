import * as GetFlatScopeList from '../GetFlatScopeList/GetFlatScopeList.js'

export const getScopeCount = async (session, objectGroup) => {
  const flatScopeList = await GetFlatScopeList.getFlatScopeList(session, objectGroup)
  return flatScopeList.length
}
