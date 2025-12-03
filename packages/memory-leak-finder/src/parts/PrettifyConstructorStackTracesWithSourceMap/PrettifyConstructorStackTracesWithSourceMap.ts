import * as Arrays from '../Arrays/Arrays.ts'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.ts'
import * as GetEventListenersQuery from '../GetEventListenersQuery/GetEventListenersQuery.ts'

const sortOriginal = (cleanInstances) => {
  const cleaned: any[] = []
  const sorted = Arrays.toSorted(cleanInstances, (a: any, b: any) => (a.originalIndex || 0) - (b.originalIndex || 0))
  let current: any[] = []
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

export const prettifyConstructorStackTracesWithSourceMap = async (constructorStackTraces, scriptMap) => {
  const fullQuery: any[] = []
  for (let i = 0; i < constructorStackTraces.length; i++) {
    const stackTrace = constructorStackTraces[i]
    const eventListeners = GetEventListenersQuery.getEventListenerQuery(stackTrace, scriptMap)
    fullQuery.push(...eventListeners)
  }
  const cleanPrettyInstances = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(fullQuery, false)
  const sorted = sortOriginal(cleanPrettyInstances)
  return sorted
}
