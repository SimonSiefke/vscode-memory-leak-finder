import type { Dynamic } from '../Types/Types.ts'
import * as DeduplicateEventListeners from '../DeduplicateEventListeners/DeduplicateEventListeners.ts'
import * as GetEventListenerKey from '../GetEventListenerKey/GetEventListenerKey.ts'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.ts'
import * as GetEventListenersQuery from '../GetEventListenersQuery/GetEventListenersQuery.ts'

const mergeOriginalStack = (eventListeners: Dynamic, cleanInstances: Dynamic) => {
  const reverseMap = Object.create(null)
  for (const instance of cleanInstances) {
    reverseMap[instance.originalIndex] = instance
  }
  const merged: Dynamic[] = []
  let originalIndex = 0
  for (const eventListener of eventListeners) {
    originalIndex++
    const originalStack: Dynamic[] = []
    let sourcesHash: string | null = null
    for (let i = 0; i < eventListener.stack.length; i++) {
      originalIndex++
      const instance = reverseMap[originalIndex]
      if (instance && instance.originalStack) {
        originalStack.push(instance.originalStack[0])
        if (i === 0 && instance.sourcesHash) {
          sourcesHash = instance.sourcesHash
        }
      }
    }
    const { sourceMaps, ...rest } = eventListener
    merged.push({
      ...rest,
      originalStack,
      sourcesHash,
    })
  }
  return merged
}

export const compareEventListenersWithStackTraces = async (before: Dynamic, after: Dynamic) => {
  const afterResult = after && typeof after === 'object' && 'result' in after ? after.result : after
  const scriptMap = after && typeof after === 'object' && 'scriptMap' in after ? after.scriptMap : undefined
  const map = Object.create(null)
  for (const listener of before) {
    const key = GetEventListenerKey.getEventListenerKey(listener)
    map[key] ||= 0
    map[key]++
  }
  const leaked: Dynamic[] = []
  for (const listener of afterResult) {
    const key = GetEventListenerKey.getEventListenerKey(listener)
    if (map[key]) {
      map[key]--
    } else {
      leaked.push(listener)
    }
  }
  const deduplicatedEventListeners = DeduplicateEventListeners.deduplicateEventListeners(leaked)
  const classNames = false
  if (scriptMap) {
    const stackTraces = deduplicatedEventListeners.map((eventListener: Dynamic) => eventListener.stack)
    const fullQuery = GetEventListenersQuery.getEventListenerQuery(stackTraces, scriptMap)
    const cleanStackFrames = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(fullQuery, classNames)
    return mergeOriginalStack(deduplicatedEventListeners, cleanStackFrames)
  }
  const cleanLeakedEventListeners = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(
    deduplicatedEventListeners,
    classNames,
  )
  return cleanLeakedEventListeners
}
