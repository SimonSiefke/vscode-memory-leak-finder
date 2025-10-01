import { getLocationFieldOffsets } from '../GetLocationFieldOffsets/GetLocationFieldOffsets.ts'
import { getUniqueLocationMap2 } from '../GetUniqueLocationMap2/GetUniqueLocationMap2.ts'
import { addOriginalSources } from '../AddOriginalSources/AddOriginalSources.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'
import type { UniqueLocation, UniqueLocationMap } from '../UniqueLocationMap/UniqueLocationMap.ts'

const emptyItem = {
  count: 0,
}

export interface CompareResult {
  readonly column: number
  readonly count: number
  readonly delta: number
  readonly line: number
  readonly scriptId: number
  readonly name: string
  readonly url?: string
  readonly sourceMapUrl?: string
  readonly originalSource?: string | null
  readonly originalUrl?: string | null
  readonly originalLine?: number | null
  readonly originalColumn?: number | null
  readonly originalName?: string | null
  readonly sourceLocation?: string
  readonly originalLocation?: string
}

interface UniqueLocationWithDelta extends UniqueLocation {
  readonly delta: number
}

const getNewItems = (map1: UniqueLocationMap, map2: UniqueLocationMap, minCount: number): readonly UniqueLocationWithDelta[] => {
  const newitems: UniqueLocationWithDelta[] = []
  for (const key of Object.keys(map2)) {
    const oldItem = map1[key] || emptyItem
    const newItem = map2[key]
    const delta = newItem.count - oldItem.count
    if (delta > 0 && newItem.count >= minCount) {
      newitems.push({ ...newItem, delta })
    }
  }
  return newitems
}

const formatUniqueLocations = (
  uniqueItems: readonly UniqueLocationWithDelta[],
  locations: Uint32Array,
  itemsPerLocation: number,
  scriptIdOffset: number,
  lineOffset: number,
  columnOffset: number,
  objectIndexOffset: number,
  nodes: Uint32Array,
  nodeNameOffset: number,
  strings: readonly string[],
): readonly CompareResult[] => {
  return uniqueItems.map((newItem: UniqueLocationWithDelta) => {
    const scriptId = locations[newItem.index * itemsPerLocation + scriptIdOffset]
    const line = locations[newItem.index * itemsPerLocation + lineOffset]
    const column = locations[newItem.index * itemsPerLocation + columnOffset]
    const nodeIndex = locations[newItem.index * itemsPerLocation + objectIndexOffset]
    const nodeNameIndex = nodes[nodeIndex + nodeNameOffset]
    const nodeName = strings[nodeNameIndex] || 'anonymous'

    return {
      column,
      count: newItem.count,
      delta: newItem.delta,
      line,
      scriptId,
      name: nodeName,
    }
  })
}

export interface CompareFunctionsOptions {
  readonly minCount?: number
  readonly excludeOriginalPaths?: readonly string[]
}

export const compareHeapSnapshotFunctionsInternal2 = async (
  before: Snapshot,
  after: Snapshot,
  options: CompareFunctionsOptions,
): Promise<readonly any[]> => {
  console.log(`[HeapSnapshotWorker] compareHeapSnapshotFunctionsInternal2 starting`)
  const startTime = performance.now()

  const minCount = options.minCount || 0
  const { itemsPerLocation, scriptIdOffset, lineOffset, columnOffset, objectIndexOffset } = getLocationFieldOffsets(
    after.meta.location_fields,
  )
  const nodeNameOffset = after.meta.node_fields.indexOf('name')

  console.log(`[HeapSnapshotWorker] Creating unique location maps`)
  const mapTime = performance.now()
  const map1 = getUniqueLocationMap2(before)
  const map2 = getUniqueLocationMap2(after)
  console.log(`[HeapSnapshotWorker] Unique location maps created in ${(performance.now() - mapTime).toFixed(2)}ms`)

  console.log(`[HeapSnapshotWorker] Getting new items`)
  const newItemsTime = performance.now()
  const newItems = getNewItems(map1, map2, minCount)
  console.log(`[HeapSnapshotWorker] New items found in ${(performance.now() - newItemsTime).toFixed(2)}ms: ${newItems.length} items`)

  console.log(`[HeapSnapshotWorker] Formatting unique locations`)
  const formatTime = performance.now()
  const formattedItems = formatUniqueLocations(
    newItems,
    after.locations,
    itemsPerLocation,
    scriptIdOffset,
    lineOffset,
    columnOffset,
    objectIndexOffset,
    after.nodes,
    nodeNameOffset,
    after.strings,
  )
  console.log(`[HeapSnapshotWorker] Unique locations formatted in ${(performance.now() - formatTime).toFixed(2)}ms`)

  console.log(`[HeapSnapshotWorker] Adding original sources`)
  const enrichTime = performance.now()
  let enriched = await addOriginalSources(formattedItems)
  console.log(`[HeapSnapshotWorker] Original sources added in ${(performance.now() - enrichTime).toFixed(2)}ms`)

  const excludes = options.excludeOriginalPaths || []
  if (excludes.length > 0) {
    console.log(`[HeapSnapshotWorker] Filtering excluded paths: ${excludes.length} exclusions`)
    const filterTime = performance.now()
    const lowered = excludes.map((e) => e.toLowerCase())
    enriched = enriched.filter((item) => {
      const original = (item.originalUrl || item.originalSource || '').toLowerCase()
      if (!original) {
        return true
      }
      for (const ex of lowered) {
        if (original.includes(ex)) {
          return false
        }
      }
      return true
    })
    console.log(`[HeapSnapshotWorker] Excluded paths filtered in ${(performance.now() - filterTime).toFixed(2)}ms`)
  }

  console.log(`[HeapSnapshotWorker] Sorting and cleaning results`)
  const sortTime = performance.now()
  const sorted = enriched.toSorted((a, b) => b.count - a.count)
  const cleanItems = sorted.map((item) => {
    return {
      count: item.count,
      delta: item.delta,
      name: item.name,
      sourceLocation: item.sourceLocation,
      originalLocation: item.originalLocation,
      originalName: item.originalName,
    }
  })
  console.log(`[HeapSnapshotWorker] Results sorted and cleaned in ${(performance.now() - sortTime).toFixed(2)}ms`)

  const totalTime = performance.now() - startTime
  console.log(`[HeapSnapshotWorker] compareHeapSnapshotFunctionsInternal2 completed in ${totalTime.toFixed(2)}ms, returning ${cleanItems.length} items`)
  return cleanItems
}
