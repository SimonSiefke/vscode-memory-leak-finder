import * as CreateCountMap from '../CreateCountMap/CreateCountMap.js'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.js'

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

const addSourceLocations = async (functionObjects) => {
  const classNames = true
  const requests = functionObjects.map((item) => {
    return {
      ...item,
      stack: [item.url],
      sourceMaps: [item.sourceMapUrl],
    }
  })
  const withOriginalStack = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(requests, classNames)
  const normalized = withOriginalStack.map((item) => {
    const { stack, count, originalStack, originalName, name, beforeCount, delta } = item

    return {
      name: originalName || name,
      count,
      delta,
      url: originalStack?.[0] || stack?.[0] || '',
    }
  })
  return normalized
}

export const compareNamedFunctionCount2 = async (before, after) => {
  const leaked = mergeFunctions(before, after)
  const withSourceLocations = await addSourceLocations(leaked)
  return withSourceLocations
}
