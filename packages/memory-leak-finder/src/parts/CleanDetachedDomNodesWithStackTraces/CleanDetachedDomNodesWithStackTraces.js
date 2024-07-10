import * as GetEventListenersQuery from '../GetEventListenersQuery/GetEventListenersQuery.js'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.js'

const mergeOriginal = (nodes, cleanInstances) => {
  const reverseMap = Object.create(null)
  for (const instance of cleanInstances) {
    reverseMap[instance.originalIndex] = instance
  }
  const merged = []
  let originalIndex = 0
  for (const node of nodes) {
    originalIndex++
    const originalStack = []
    for (let i = 0; i < node.stackTrace.length; i++) {}
    originalIndex++
    const instance = reverseMap[originalIndex]
    if (instance && instance.originalStack) {
      originalStack.push(instance.originalStack[0])
    }
    merged.push({
      ...node,
      originalStack,
    })
  }
  return merged
}

export const cleanDetachedDomNodesWithStackTraces = async (nodes, scriptMap) => {}
