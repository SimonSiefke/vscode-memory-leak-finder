import * as Assert from '../Assert/Assert.ts'
import * as GetNamedFunctionDifference from '../GetNamedFunctionDifference/GetNamedFunctionDifference.ts'
import * as SortNamedFunctions from '../SortNamedFunctions/SortNamedFunctions.ts'

export const compareFunctionDifference = (before, after) => {
  Assert.array(before)
  Assert.array(after)
  const sortedBefore = SortNamedFunctions.sortNamedFunctions(before)
  const sortedAfter = SortNamedFunctions.sortNamedFunctions(after)
  const difference = GetNamedFunctionDifference.getDifference(sortedBefore, sortedAfter)
  return difference
}
