import * as GetEventListenersQuery from '../GetEventListenersQuery/GetEventListenersQuery.js'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.js'

const mergeOriginal = (nodes, cleanInstances) => {
  const merged = []
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    const instance = cleanInstances[i]
    merged.push({
      ...node,
      originalStack: instance.originalStack,
    })
  }
  return merged
}

export const cleanDetachedDomNodesWithStackTraces = async (nodes, scriptMap) => {
  const fullQuery = []
  for (const node of nodes) {
    const stackTrace = node.stackTrace
    const query = GetEventListenersQuery.getEventListenerQuery(stackTrace, scriptMap)
    fullQuery.push(query)
  }
  const cleanInstances = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(fullQuery, false)
  const sorted = mergeOriginal(nodes, cleanInstances)
  return sorted
}
