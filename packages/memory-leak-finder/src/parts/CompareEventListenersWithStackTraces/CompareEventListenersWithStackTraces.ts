import type { Dynamic } from '../Types/Types.ts'
import * as DeduplicateEventListeners from '../DeduplicateEventListeners/DeduplicateEventListeners.ts'
import * as GetEventListenerKey from '../GetEventListenerKey/GetEventListenerKey.ts'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.ts'
export const compareEventListenersWithStackTraces = async (before: Dynamic, after: Dynamic) => {
  const map = Object.create(null)
  for (const listener of before) {
    const key = GetEventListenerKey.getEventListenerKey(listener)
    map[key] ||= 0
    map[key]++
  }
  const leaked: Dynamic[] = []
  for (const listener of after) {
    const key = GetEventListenerKey.getEventListenerKey(listener)
    if (map[key]) {
      map[key]--
    } else {
      leaked.push(listener)
    }
  }
  const deduplicatedEventListeners = DeduplicateEventListeners.deduplicateEventListeners(leaked)
  const classNames = false
  const cleanLeakedEventListeners = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(
    deduplicatedEventListeners,
    classNames,
  )
  return cleanLeakedEventListeners
}
