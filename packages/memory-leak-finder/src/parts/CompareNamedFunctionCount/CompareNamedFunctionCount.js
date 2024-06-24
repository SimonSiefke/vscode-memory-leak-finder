import * as SortNamedFunctions from '../SortNamedFunctions/SortNamedFunctions.js'
import * as CreateCountMap from '../CreateCountMap/CreateCountMap.js'

const mergeFunctions = (beforeFunctions, afterFunctions) => {
  const beforeMap = CreateCountMap.createCountMap(beforeFunctions, 'url')
  const leaked = []
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

export const compareNamedFunctionCount = (before, after) => {
  const beforeFunctions = SortNamedFunctions.sortNamedFunctions(before)
  const afterFunctions = SortNamedFunctions.sortNamedFunctions(after)
  const leaked = mergeFunctions(beforeFunctions, afterFunctions)
  return leaked
}
