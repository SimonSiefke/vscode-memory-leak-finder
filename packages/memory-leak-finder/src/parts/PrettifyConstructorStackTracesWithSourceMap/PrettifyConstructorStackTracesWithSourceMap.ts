import type { Dynamic } from '../Types/Types.ts'
import * as Arrays from '../Arrays/Arrays.ts'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.ts'
import * as GetEventListenersQuery from '../GetEventListenersQuery/GetEventListenersQuery.ts'
const sortOriginal = (cleanInstances: Dynamic) => {
  const cleaned: Dynamic[] = []
  const sorted = Arrays.toSorted(cleanInstances, (a: Dynamic, b: Dynamic) => (a.originalIndex || 0) - (b.originalIndex || 0))
  let current: Dynamic[] = []
  let currentIndex = -1
  for (const value of sorted) {
    if (value.originalIndex > currentIndex) {
      currentIndex = value.originalIndex
      current = []
      cleaned.push(current)
    }
    const originalStack = value.originalStack || []
    current.push(originalStack[0])
  }
  return cleaned
}
export const prettifyConstructorStackTracesWithSourceMap = async (constructorStackTraces: Dynamic, scriptMap: Dynamic) => {
  const fullQuery: Dynamic[] = []
  for (let i = 0; i < constructorStackTraces.length; i++) {
    const stackTrace = constructorStackTraces[i]
    const eventListeners = GetEventListenersQuery.getEventListenerQuery(stackTrace, scriptMap)
    fullQuery.push(...eventListeners)
  }
  const cleanPrettyInstances = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(fullQuery, false)
  const sorted = sortOriginal(cleanPrettyInstances)
  return sorted
}
