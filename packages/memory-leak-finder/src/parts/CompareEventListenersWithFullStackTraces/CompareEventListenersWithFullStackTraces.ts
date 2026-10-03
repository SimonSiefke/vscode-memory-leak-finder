import type { Dynamic } from '../Types/Types.ts'
import * as Assert from '../Assert/Assert.ts'
import * as DeduplicateEventListeners from '../DeduplicateEventListeners/DeduplicateEventListeners.ts'
import * as GetEventListenerKey from '../GetEventListenerKey/GetEventListenerKey.ts'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.ts'
import * as GetEventListenersQuery from '../GetEventListenersQuery/GetEventListenersQuery.ts'
import * as MergeEventListenersWithOriginalStacks from '../MergeEventListenersWithOriginalStacks/MergeEventListenersWithOriginalStacks.ts'

const compareCount = (a: Dynamic, b: Dynamic) => {
  return b.count - a.count
}

export const compareEventListenersWithFullStackTraces = async (before: Dynamic, after: Dynamic) => {
  Assert.array(before)
  Assert.object(after)
  const { result, scriptMap } = after
  Assert.array(result)
  Assert.object(scriptMap)
  const map = Object.create(null)
  for (const listener of before) {
    const key = GetEventListenerKey.getEventListenerKey(listener)
    map[key] ||= 0
    map[key]++
  }
  const leaked: Dynamic[] = []
  for (const listener of result) {
    const key = GetEventListenerKey.getEventListenerKey(listener)
    if (map[key]) {
      map[key]--
    } else {
      leaked.push(listener)
    }
  }
  const deduplicated = DeduplicateEventListeners.deduplicateEventListeners(leaked)
  const sorted = deduplicated.toSorted(compareCount)
  if (sorted.length === 0) {
    return sorted
  }
  const stacks = sorted.map((eventListener: Dynamic) => eventListener.stack)
  const fullQuery = GetEventListenersQuery.getEventListenerQuery(stacks, scriptMap)
  const cleanInstances = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(fullQuery, false)
  return MergeEventListenersWithOriginalStacks.mergeEventListenersWithOriginalStacks(sorted, cleanInstances)
}
