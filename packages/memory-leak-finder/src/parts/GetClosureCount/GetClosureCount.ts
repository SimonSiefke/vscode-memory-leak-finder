import * as GetFlatScopeList from '../GetFlatScopeList/GetFlatScopeList.ts'
import * as IsClosure from '../IsClosure/IsClosure.ts'

export const getClosureCount = async (session, objectGroup) => {
  const flatScopeList = await GetFlatScopeList.getFlatScopeList(session, objectGroup)
  const closures = flatScopeList.filter(IsClosure.isClosure)
  const closureCount = closures.length
  return closureCount
}
