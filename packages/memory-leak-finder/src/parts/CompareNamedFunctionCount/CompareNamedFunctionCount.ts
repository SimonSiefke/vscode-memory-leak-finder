import type { Dynamic } from '../Types/Types.ts'
import * as CreateCountMap from '../CreateCountMap/CreateCountMap.ts'
import * as SortNamedFunctions from '../SortNamedFunctions/SortNamedFunctions.ts'
const mergeFunctions = (beforeFunctions: Dynamic, afterFunctions: Dynamic) => {
  const beforeMap = CreateCountMap.createCountMap(beforeFunctions, 'url')
  const leaked: Dynamic[] = []
  for (const element of afterFunctions) {
    const beforeCount = beforeMap[element.url] || ''
    const afterCount = element.count
    const delta = afterCount - beforeCount
    if (delta > 0) {
      leaked.push({
        ...element,
        delta,
      })
    }
  }
  return leaked
}
export const compareNamedFunctionCount = (before: Dynamic, after: Dynamic) => {
  const beforeFunctions = SortNamedFunctions.sortNamedFunctions(before)
  const afterFunctions = SortNamedFunctions.sortNamedFunctions(after)
  const leaked = mergeFunctions(beforeFunctions, afterFunctions)
  return leaked
}
