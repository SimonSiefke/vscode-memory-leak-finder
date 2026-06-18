import type { Dynamic } from '../Types/Types.ts'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.ts'
import * as GetEventListenersQuery from '../GetEventListenersQuery/GetEventListenersQuery.ts'
const mergeOriginal = (nodes: Dynamic, cleanInstances: Dynamic) => {
  const reverseMap = Object.create(null)
  for (const instance of cleanInstances) {
    reverseMap[instance.originalIndex] = instance
  }
  const merged: Dynamic[] = []
  let originalIndex = 0
  for (const node of nodes) {
    originalIndex++
    const originalStack: Dynamic[] = []
    let sourcesHash: string | null | undefined = null
    for (let i = 0; i < node.stackTrace.length; i++) {
      originalIndex++
      const instance = reverseMap[originalIndex]
      if (instance && instance.originalStack) {
        originalStack.push(instance.originalStack[0])
        if (i === 0 && instance.sourcesHash) {
          sourcesHash = instance.sourcesHash
        }
      }
    }
    merged.push({
      ...node,
      originalStack,
      sourcesHash,
    })
  }
  return merged
}
export const cleanDetachedDomNodesWithStackTraces = async (nodes: Dynamic, scriptMap: Dynamic) => {
  const stackTraces = nodes.map((node: Dynamic) => node.stackTrace)
  const fullQuery = GetEventListenersQuery.getEventListenerQuery(stackTraces, scriptMap)
  const cleanInstances = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(fullQuery, false)
  const sorted = mergeOriginal(nodes, cleanInstances)
  return sorted
}
