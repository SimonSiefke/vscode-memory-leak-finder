import * as DeduplicateEventListeners from '../DeduplicateEventListeners/DeduplicateEventListeners.js'
import * as GetEventListenerKey from '../GetEventListenerKey/GetEventListenerKey.js'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.js'

export const compareEventListeners = async (before, after) => {
  const map = Object.create(null)
  for (const listener of before) {
    const key = GetEventListenerKey.getEventListenerKey(listener)
    map[key] ||= 0
    map[key]++
  }
  const leaked = []
  for (const listener of after) {
    const key = GetEventListenerKey.getEventListenerKey(listener)
    if (!map[key]) {
      leaked.push(listener)
    } else {
      map[key]--
    }
  }
  const deduplicatedEventListeners = DeduplicateEventListeners.deduplicateEventListeners(leaked)
  const cleanLeakedEventListeners =
    await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(deduplicatedEventListeners)
  return cleanLeakedEventListeners
}
