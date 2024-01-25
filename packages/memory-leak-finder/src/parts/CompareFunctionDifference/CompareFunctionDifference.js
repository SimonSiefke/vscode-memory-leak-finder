import * as Assert from '../Assert/Assert.js'
import * as SortNamedFunctions from '../SortNamedFunctions/SortNamedFunctions.js'

const getDifference = (sortedBefore, sortedAfter) => {
  const result = []
  const beforeMap = Object.create(null)
  for (const value of sortedBefore) {
    beforeMap[value.url] = value.count
  }
  for (const value of sortedAfter) {
    const beforeCount = beforeMap[value.url] || 0
    if (value.count <= beforeCount) {
      continue
    }
    result.push({
      name: value.name,
      count: value.count,
      beforeCount,
      url: value.url,
    })
  }
  return result
}

export const compareFunctionDifference = (before, after) => {
  Assert.array(before)
  Assert.array(after)
  const sortedBefore = SortNamedFunctions.sortNamedFunctions(before)
  const sortedAfter = SortNamedFunctions.sortNamedFunctions(after)
  const difference = getDifference(sortedBefore, sortedAfter)
  return difference
}
