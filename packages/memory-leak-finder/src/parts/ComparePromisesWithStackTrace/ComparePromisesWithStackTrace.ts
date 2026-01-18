import * as Assert from '../Assert/Assert.ts'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.ts'
import * as GetEventListenersQuery from '../GetEventListenersQuery/GetEventListenersQuery.ts'
import * as Hash from '../Hash/Hash.ts'

const hashPromise = (item: { preview: { properties: readonly unknown[] }; stackTrace: string | readonly string[] }): string => {
  const { preview, stackTrace } = item
  const { properties } = preview
  return Hash.hash({
    properties,
    stackTrace,
  })
}

const getAdded = (before: readonly { preview: { properties: readonly unknown[] }; stackTrace: string | readonly string[] }[], after: readonly { preview: { properties: readonly unknown[] }; stackTrace: string | readonly string[] }[]): { afterCounts: Record<string, number>; beforeCounts: Record<string, number>; leaked: readonly { preview: { properties: readonly unknown[] }; stackTrace: string | readonly string[] }[] } => {
  const beforeMap: { [hash: string]: number } = Object.create(null)
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
  const leaked: { preview: { properties: readonly unknown[] }; stackTrace: string | readonly string[] }[] = []
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

const deduplicate = (leaked: readonly { preview: { properties: readonly unknown[] }; stackTrace: string | readonly string[] }[], beforeCounts: Record<string, number>, afterCounts: Record<string, number>): readonly { preview: { properties: readonly unknown[] }; stackTrace: string | readonly string[]; count: number; delta: number; [key: string]: unknown }[] => {
  const map: { [hash: string]: { preview: { properties: readonly unknown[] }; stackTrace: string | readonly string[] } } = Object.create(null)
  for (const item of leaked) {
    const hash = hashPromise(item)
    if (!map[hash]) {
      map[hash] = item
    }
  }
  const deduplicated: { preview: { properties: readonly unknown[] }; stackTrace: string | readonly string[]; count: number; delta: number; [key: string]: unknown }[] = []
  for (const [key, value] of Object.entries(map)) {
    const beforeCount = beforeCounts[key] || 0
    const afterCount = afterCounts[key] || 0
    const delta = afterCount - beforeCount
    deduplicated.push({
      ...value,
      count: afterCount,
      delta,
    } as { preview: { properties: readonly unknown[] }; stackTrace: string | readonly string[]; count: number; delta: number; [key: string]: unknown })
  }
  return deduplicated
}

const cleanItem = (item: { count: number; delta: number; preview: { properties: readonly unknown[] }; stackTrace: string | readonly string[] }): { count: number; delta: number; properties: readonly unknown[]; stackTrace: readonly string[] } => {
  const { count, delta, preview, stackTrace } = item
  const { properties } = preview
  return {
    count,
    delta,
    properties,
    stackTrace: typeof stackTrace === 'string' ? stackTrace.split('\n') : stackTrace,
  }
}

const clean = (items: readonly { count: number; delta: number; preview: { properties: readonly unknown[] }; stackTrace: string | readonly string[] }[]): readonly { count: number; delta: number; properties: readonly unknown[]; stackTrace: readonly string[] }[] => {
  return items.map(cleanItem)
}

const mergeOriginal = (items: readonly { count: number; delta: number; properties: readonly unknown[]; stackTrace: readonly string[] }[], cleanInstances: readonly { originalIndex?: number; originalStack?: readonly string[]; sourcesHash?: string | null }[]): readonly { count: number; delta: number; properties: readonly unknown[]; stackTrace: readonly string[]; originalStack: readonly string[]; sourcesHash: string | null | undefined }[] => {
  const reverseMap: { [index: number]: { originalIndex?: number; originalStack?: readonly string[]; sourcesHash?: string | null } } = Object.create(null)
  for (const instance of cleanInstances) {
    if (instance.originalIndex !== undefined) {
      reverseMap[instance.originalIndex] = instance
    }
  }
  const merged: { count: number; delta: number; properties: readonly unknown[]; stackTrace: readonly string[]; originalStack: readonly string[]; sourcesHash: string | null | undefined }[] = []
  let originalIndex = 0
  for (const item of items) {
    originalIndex++
    const originalStack: string[] = []
    let sourcesHash: string | null | undefined = null
    for (let i = 0; i < item.stackTrace.length; i++) {
      originalIndex++
      const instance = reverseMap[originalIndex]
      if (instance && instance.originalStack) {
        originalStack.push(instance.originalStack[0])
        if (i === 0 && instance.sourcesHash) {
          sourcesHash = instance.sourcesHash
        }
      }
    }
    merged.push({
      ...item,
      originalStack,
      sourcesHash,
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
    const { runs } = context
    filtered = cleanLeaked.filter((item: { delta: number }) => item.delta >= runs)
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
