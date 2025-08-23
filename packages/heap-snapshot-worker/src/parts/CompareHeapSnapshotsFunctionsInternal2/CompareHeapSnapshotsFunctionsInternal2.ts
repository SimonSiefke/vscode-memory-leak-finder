import { getLocationFieldOffsets } from '../GetLocationFieldOffsets/GetLocationFieldOffsets.ts'
import { getUniqueLocationMap2 } from '../GetUniqueLocationMap2/GetUniqueLocationMap2.ts'
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
}

interface UniqueLocationWithDelta extends UniqueLocation {
  readonly delta: number
}

const getNewItems = (map1: UniqueLocationMap, map2: UniqueLocationMap): readonly UniqueLocationWithDelta[] => {
  const newitems: UniqueLocationWithDelta[] = []
  for (const key of Object.keys(map2)) {
    const oldItem = map1[key] || emptyItem
    const newItem = map2[key]
    const delta = newItem.count - oldItem.count
    if (delta > 0) {
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
): readonly CompareResult[] => {
  return uniqueItems.map((newItem: UniqueLocationWithDelta) => {
    const scriptId = locations[newItem.index * itemsPerLocation + scriptIdOffset]
    const line = locations[newItem.index * itemsPerLocation + lineOffset]
    const column = locations[newItem.index * itemsPerLocation + columnOffset]
    return {
      column,
      count: newItem.count,
      delta: newItem.delta,
      line,
      scriptId,
    }
  })
}

export const compareHeapSnapshotFunctionsInternal2 = (before: Snapshot, after: Snapshot): readonly CompareResult[] => {
  const { itemsPerLocation, scriptIdOffset, lineOffset, columnOffset } = getLocationFieldOffsets(after.meta.location_fields)
  const map1 = getUniqueLocationMap2(before)
  const map2 = getUniqueLocationMap2(after)
  const newItems = getNewItems(map1, map2)
  const formattedItems = formatUniqueLocations(newItems, after.locations, itemsPerLocation, scriptIdOffset, lineOffset, columnOffset)
  const sorted = formattedItems.toSorted((a, b) => b.count - a.count)
  return sorted
}
