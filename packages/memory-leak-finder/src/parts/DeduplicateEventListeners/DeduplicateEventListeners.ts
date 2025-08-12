import * as GetEventListenerKey from '../GetEventListenerKey/GetEventListenerKey.ts'

export const deduplicateEventListeners = (eventListeners) => {
  const countMap = Object.create(null)
  const eventListenerMap = Object.create(null)
  for (const eventListener of eventListeners) {
    const key = GetEventListenerKey.getEventListenerKey(eventListener)
    eventListenerMap[key] = eventListener
    countMap[key] ||= 0
    countMap[key]++
  }
  const deduplicated = []
  for (const [key, value] of Object.entries(eventListenerMap)) {
    const count = countMap[key]
    deduplicated.push({
      // @ts-ignore
      ...(value as any),
      count,
    })
  }
  return deduplicated
}
