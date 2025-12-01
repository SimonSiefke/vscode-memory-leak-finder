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
  const map = Object.create(null)
  for (const item of before) {
    const hash = hashPromise(item)
    map[hash] ||= 0
    map[hash]++
  }
  const leaked = []
  for (const item of after) {
    const hash = hashPromise(item)
    if (map[hash]) {
      map[hash]--
    } else {
      leaked.push(item)
    }
  }
  return leaked
}

const deduplicate = (leaked) => {
  const map = Object.create(null)
  const countMap = Object.create(null)
  for (const item of leaked) {
    const hash = hashPromise(item)
    map[hash] = item
    countMap[hash] ||= 0
    countMap[hash]++
  }
  const deduplicated: any[] = []
  for (const [key, value] of Object.entries(map)) {
    const count = countMap[key]
    deduplicated.push({
      ...(value as any),
      count,
    })
  }
  return deduplicated
}

const cleanItem = (item) => {
  const { preview, stackTrace, count } = item
  const { properties } = preview
  return {
    count,
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
  const merged = []
  let originalIndex = 0
  for (const item of items) {
    originalIndex++
    const originalStack = []
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

export const comparePromisesWithStackTrace = async (before, after) => {
  Assert.array(before)
  let afterResult = after
  let scriptMap = null
  if (after && typeof after === 'object' && 'result' in after && 'scriptMap' in after) {
    afterResult = after.result
    scriptMap = after.scriptMap
  }
  Assert.array(afterResult)
  const leaked = getAdded(before, afterResult)
  const deduplicated = deduplicate(leaked)
  const sorted = sortItems(deduplicated)
  const cleanLeaked = clean(sorted)
  if (scriptMap) {
    const stackTraces = cleanLeaked.map((item) => item.stackTrace)
    const fullQuery = GetEventListenersQuery.getEventListenerQuery(stackTraces, scriptMap)
    const cleanInstances = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(fullQuery, false)
    const sortedWithOriginal = mergeOriginal(cleanLeaked, cleanInstances)
    return sortedWithOriginal
  }
  return cleanLeaked
}
