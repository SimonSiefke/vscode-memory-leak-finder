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

export const compareNamedFunctionCount2 = (before, after) => {
  const leaked = mergeFunctions(before, after)
  return leaked
}
