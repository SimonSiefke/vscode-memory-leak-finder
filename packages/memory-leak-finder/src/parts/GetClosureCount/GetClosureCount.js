import * as GetFlatScopeList from '../GetFlatScopeList/GetFlatScopeList.js'

const isClosure = (scope) => {
  return scope.description.startsWith('Closure (')
}

const getUniqueCount = (flatScopeMap) => {
  const counts = Object.create(null)
  for (const item of flatScopeMap) {
    counts[item.description] ||= 0
    counts[item.description]++
  }
  return counts
}

export const getClosureCount = async (session, objectGroup) => {
  const flatScopeList = await GetFlatScopeList.getFlatScopeList(session, objectGroup)
  // console.log({ flatScopeList })
  const uniqueCounts = getUniqueCount(flatScopeList)
  console.log(JSON.stringify(uniqueCounts, null, 2))
  const closures = flatScopeList.filter(isClosure)
  const closureCount = closures.length
  return closureCount
}
