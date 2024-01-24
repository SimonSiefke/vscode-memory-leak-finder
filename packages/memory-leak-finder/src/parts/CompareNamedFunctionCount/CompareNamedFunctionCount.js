import * as SortNamedFunctions from '../SortNamedFunctions/SortNamedFunctions.js'

export const compareNamedFunctionCount = (before, after) => {
  return {
    after: SortNamedFunctions.sortNamedFunctions(after),
    before: SortNamedFunctions.sortNamedFunctions(before),
  }
}
