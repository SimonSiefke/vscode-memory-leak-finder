import * as GetEventListenerKey from '../GetEventListenerKey/GetEventListenerKey.ts'

export const deduplicateEventListeners = <T extends { [key: string]: unknown }>(eventListeners: readonly T[]): readonly (T & { count: number })[] => {
  const countMap: { [key: string]: number } = Object.create(null)
  const eventListenerMap: { [key: string]: T } = Object.create(null)
  for (const eventListener of eventListeners) {
    const key = GetEventListenerKey.getEventListenerKey(eventListener)
    eventListenerMap[key] = eventListener
    countMap[key] ||= 0
    countMap[key]++
  }
  const deduplicated: (T & { count: number })[] = []
  for (const [key, value] of Object.entries(eventListenerMap)) {
    const count = countMap[key]
    deduplicated.push({
      ...value,
      count,
    })
  }
  return deduplicated
}
