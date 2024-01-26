import * as Assert from '../Assert/Assert.js'
import * as GetNamedFunctionDifference from '../GetNamedFunctionDifference/GetNamedFunctionDifference.js'
import * as SortNamedFunctions from '../SortNamedFunctions/SortNamedFunctions.js'

export const compareFunctionDifference = (before, after) => {
  Assert.array(before)
  Assert.array(after)
  const sortedBefore = SortNamedFunctions.sortNamedFunctions(before)
  const sortedAfter = SortNamedFunctions.sortNamedFunctions(after)
  const difference = GetNamedFunctionDifference.getDifference(sortedBefore, sortedAfter)
  return difference
}
