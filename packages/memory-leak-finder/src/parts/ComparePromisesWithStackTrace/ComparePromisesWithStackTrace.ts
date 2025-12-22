import * as Assert from '../Assert/Assert.ts'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.ts'
import * as GetEventListenersQuery from '../GetEventListenersQuery/GetEventListenersQuery.ts'
import * as Hash from '../Hash/Hash.ts'

const hashPromise = (item) => {
  const { preview, stackTrace } = item
  const { properties } = preview
  return Hash.hash({
    properties,
    stackTrace,
  })
}

const getAdded = (before, after) => {
  const beforeMap = Object.create(null)
  for (const item of before) {
    const hash = hashPromise(item)
    beforeMap[hash] ||= 0
    beforeMap[hash]++
  }
  const beforeCounts: Record<string, number> = Object.create(null)
  for (const hash in beforeMap) {
    beforeCounts[hash] = beforeMap[hash]
  }
  const afterCounts: Record<string, number> = Object.create(null)
  const leaked: any[] = []
  for (const item of after) {
    const hash = hashPromise(item)
    afterCounts[hash] ||= 0
    afterCounts[hash]++
    if (beforeMap[hash]) {
      beforeMap[hash]--
    } else {
      leaked.push(item)
    }
  }
  return { afterCounts, beforeCounts, leaked }
}

const deduplicate = (leaked, beforeCounts: Record<string, number>, afterCounts: Record<string, number>) => {
  const map = Object.create(null)
  for (const item of leaked) {
    const hash = hashPromise(item)
    if (!map[hash]) {
      map[hash] = item
    }
  }
  const deduplicated: any[] = []
  for (const [key, value] of Object.entries(map)) {
    const beforeCount = beforeCounts[key] || 0
    const afterCount = afterCounts[key] || 0
    const delta = afterCount - beforeCount
    deduplicated.push({
      ...(value as any),
      count: afterCount,
      delta,
    })
  }
  return deduplicated
}

const cleanItem = (item) => {
  const { count, delta, preview, stackTrace } = item
  const { properties } = preview
  return {
    count,
    delta,
    properties,
    stackTrace: typeof stackTrace === 'string' ? stackTrace.split('\n') : stackTrace,
  }
}

const clean = (items) => {
  return items.map(cleanItem)
}

const mergeOriginal = (items, cleanInstances) => {
  const reverseMap = Object.create(null)
  for (const instance of cleanInstances) {
    reverseMap[instance.originalIndex] = instance
  }
  const merged: any[] = []
  let originalIndex = 0
  for (const item of items) {
    originalIndex++
    const originalStack: any[] = []
    for (let i = 0; i < item.stackTrace.length; i++) {
      originalIndex++
      const instance = reverseMap[originalIndex]
      if (instance && instance.originalStack) {
        originalStack.push(instance.originalStack[0])
      }
    }
    merged.push({
      ...item,
      originalStack,
    })
  }
  return merged
}

const compareItem = (a, b) => {
  return b.count - a.count
}

const sortItems = (items) => {
  return items.toSorted(compareItem)
}

export const comparePromisesWithStackTrace = async (before, after, context = {}) => {
  Assert.array(before)
  let afterResult = after
  let scriptMap = null
  if (after && typeof after === 'object' && 'result' in after && 'scriptMap' in after) {
    afterResult = after.result
    scriptMap = after.scriptMap
  }
  Assert.array(afterResult)
  const { afterCounts, beforeCounts, leaked } = getAdded(before, afterResult)
  const deduplicated = deduplicate(leaked, beforeCounts, afterCounts)
  const sorted = sortItems(deduplicated)
  const cleanLeaked = clean(sorted)
  let filtered = cleanLeaked
  if (context && typeof context === 'object' && 'runs' in context && typeof context.runs === 'number') {
    const runs = context.runs
    filtered = cleanLeaked.filter((item) => item.delta >= runs)
  }
  if (scriptMap) {
    const stackTraces = filtered.map((item) => item.stackTrace)
    const fullQuery = GetEventListenersQuery.getEventListenerQuery(stackTraces, scriptMap)
    const cleanInstances = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(fullQuery, false)
    const sortedWithOriginal = mergeOriginal(filtered, cleanInstances)
    return sortedWithOriginal
  }
  return filtered
}
