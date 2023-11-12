import * as CompareMapLeak from '../CompareMapLeak/CompareMapLeak.js'
import * as DeduplicateEventListeners from '../DeduplicateEventListeners/DeduplicateEventListeners.js'
import * as GetEventListenerKey from '../GetEventListenerKey/GetEventListenerKey.js'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.js'

export const compareEventListeners = async (before, after) => {
  const leaked = CompareMapLeak.compareMapLeak(before, after, GetEventListenerKey.getEventListenerKey)
  if (leaked.length === 0) {
    return []
  }
  const deduplicatedEventListeners = DeduplicateEventListeners.deduplicateEventListeners(leaked)
  const classNames = false
  const cleanLeakedEventListeners = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(
    deduplicatedEventListeners,
    classNames,
  )
  return cleanLeakedEventListeners
}
