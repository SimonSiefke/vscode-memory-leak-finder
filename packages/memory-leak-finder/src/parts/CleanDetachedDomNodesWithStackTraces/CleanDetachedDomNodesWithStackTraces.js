import * as GetEventListenersQuery from '../GetEventListenersQuery/GetEventListenersQuery.js'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.js'

const sortOriginal = (cleanInstances, nodes) => {
  const sorted = []
  let outerIndex = 0
  for (const node of nodes) {
    const length = node.stackTrace.length
    const originalStack = []
    for (let i = 0; i < length; i++) {
      const original = cleanInstances[outerIndex + i]
      if (original && original.originalStack) {
        originalStack.push(original.originalStack[0])
      }
    }
    outerIndex += length
    sorted.push({
      ...node,
      originalStack,
    })
  }
  return sorted
}

export const cleanDetachedDomNodesWithStackTraces = async (nodes, scriptMap) => {
  // console.log({ scriptMap, nodes })
  const fullQuery = []
  for (const node of nodes) {
    const stackTrace = node.stackTrace
    const query = GetEventListenersQuery.getEventListenerQuery(stackTrace, scriptMap)
    fullQuery.push(...query)
  }
  const cleanInstances = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(fullQuery, false)
  // console.log(JSON.stringify(cleanInstances, null, 2))
  const sorted = sortOriginal(cleanInstances, nodes)
  return sorted
}
