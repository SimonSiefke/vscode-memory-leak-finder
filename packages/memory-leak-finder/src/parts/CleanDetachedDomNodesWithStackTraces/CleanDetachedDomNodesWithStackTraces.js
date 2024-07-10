import * as GetEventListenersQuery from '../GetEventListenersQuery/GetEventListenersQuery.js'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.js'

const mergeOriginal = (nodes, cleanInstances) => {
  const reverseMap = Object.create(null)
  for (const instance of cleanInstances) {
    reverseMap[instance.originalIndex] = instance
  }
  const merged = []
  let originalIndex = 0
  // console.log(JSON.stringify(reverseMap, null, 2))
  for (const node of nodes) {
    originalIndex++
    const originalStack = []
    for (const stackLine of node.stackTrace) {
      originalIndex++
      // console.log({ originalIndex })
      const instance = reverseMap[originalIndex]
      // console.log({ instance })
      if (instance) {
        originalStack.push(instance.originalStack[0])
      }
    }
    merged.push({
      ...node,
      originalStack,
    })
  }
  return merged
}

export const cleanDetachedDomNodesWithStackTraces = async (nodes, scriptMap) => {
  const stackTraces = nodes.map((node) => node.stackTrace)
  const fullQuery = GetEventListenersQuery.getEventListenerQuery(stackTraces, scriptMap)
  const cleanInstances = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(fullQuery, false)
  // console.log({ cleanInstances })
  const sorted = mergeOriginal(nodes, cleanInstances)
  return sorted
}
