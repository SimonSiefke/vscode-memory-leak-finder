import * as GetFlatScopeList from '../GetFlatScopeList/GetFlatScopeList.js'

const isClosure = (scope) => {
  return scope.description.startsWith('Closure (')
}

export const getClosureCount = async (session, objectGroup) => {
  const flatScopeList = await GetFlatScopeList.getFlatScopeList(session, objectGroup)
  const closures = flatScopeList.filter(isClosure)
  const closureCount = closures.length
  return closureCount
}
