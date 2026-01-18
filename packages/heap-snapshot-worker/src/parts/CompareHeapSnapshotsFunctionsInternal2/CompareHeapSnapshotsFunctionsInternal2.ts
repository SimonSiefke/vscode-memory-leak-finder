import type { Snapshot } from '../Snapshot/Snapshot.ts'
import type { UniqueLocation, UniqueLocationMap } from '../UniqueLocationMap/UniqueLocationMap.ts'
import type { CompareResult } from './CompareResult.ts'
import { addOriginalSources } from '../AddOriginalSources/AddOriginalSources.ts'
import { getLocationFieldOffsets } from '../GetLocationFieldOffsets/GetLocationFieldOffsets.ts'
import { getUniqueLocationMap2 } from '../GetUniqueLocationMap2/GetUniqueLocationMap2.ts'

const emptyItem = {
  count: 0,
}

interface UniqueLocationWithDelta extends UniqueLocation {
  readonly delta: number
  readonly key: string
  readonly oldIndex: number
}

// TODO maybe have a different function for functions and closures. keys are not needed for functions

export const getNewItems = (map1: UniqueLocationMap, map2: UniqueLocationMap, minCount: number): readonly UniqueLocationWithDelta[] => {
  const newitems: UniqueLocationWithDelta[] = []
  for (const key of Object.keys(map2)) {
    const oldItem = map1[key] || emptyItem
    const newItem = map2[key]
    const delta = newItem.count - oldItem.count
    if (delta >= minCount) {
      newitems.push({ ...newItem, delta, key, oldIndex: oldItem.index })
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
      name: nodeName,
      scriptId,
    }
  })
}

export interface CompareFunctionsOptions {
  readonly excludeOriginalPaths?: readonly string[]
  readonly minCount?: number
}

import type { CompareResult } from './CompareResult.ts'

const filterOutExcluded = (items: readonly CompareResult[], excludes: readonly string[]): readonly CompareResult[] => {
  if (excludes.length > 0) {
    const lowered = excludes.map((e) => e.toLowerCase())
    return items.filter((item) => {
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
  }
  return items
}

const compareCount = (a: any, b: any) => {
  return b.count - a.count
}

const cleanItem = (item: any) => {
  return {
    count: item.count,
    delta: item.delta,
    name: item.name,
    originalLocation: item.originalLocation,
    originalName: item.originalName,
    sourceLocation: item.sourceLocation,
  }
}

export const compareHeapSnapshotFunctionsInternal2 = async (
  before: Snapshot,
  after: Snapshot,
  options: CompareFunctionsOptions,
): Promise<readonly CompareResult[]> => {
  const minCount = options.minCount || 0
  const { columnOffset, itemsPerLocation, lineOffset, objectIndexOffset, scriptIdOffset } = getLocationFieldOffsets(
    after.meta.location_fields,
  )
  const nodeNameOffset = after.meta.node_fields.indexOf('name')
  const map1 = getUniqueLocationMap2(before)
  const map2 = getUniqueLocationMap2(after)
  const newItems = getNewItems(map1, map2, minCount)
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
  const enriched = await addOriginalSources(formattedItems)
  const excludes = options.excludeOriginalPaths || []
  const filtered = filterOutExcluded(enriched, excludes)
  const sorted = filtered.toSorted(compareCount)
  const cleanItems = sorted.map(cleanItem)
  return cleanItems
}

export { type CompareResult } from './CompareResult.ts'
