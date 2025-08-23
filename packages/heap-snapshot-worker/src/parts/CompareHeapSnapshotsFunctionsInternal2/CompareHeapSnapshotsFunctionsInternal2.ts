import { getLocationFieldOffsets } from '../GetLocationFieldOffsets/GetLocationFieldOffsets.ts'
import { getUniqueLocationMap } from '../GetUniqueLocationMap/GetUniqueLocationMap.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'
import type { UniqueLocation, UniqueLocationMap } from '../UniqueLocationMap/UniqueLocationMap.ts'

const emptyItem = {
  count: 0,
}

interface PrepareFunctionsResult {
  readonly locations: Uint32Array
  readonly meta: Snapshot['meta']
  readonly map: UniqueLocationMap
}

const prepareFunctions = (snapshot: Snapshot): PrepareFunctionsResult => {
  const { itemsPerLocation, scriptIdOffset, lineOffset, columnOffset } = getLocationFieldOffsets(snapshot.meta.location_fields)
  const map = getUniqueLocationMap(snapshot.locations, itemsPerLocation, scriptIdOffset, lineOffset, columnOffset)
  return {
    locations: snapshot.locations,
    meta: snapshot.meta,
    map,
  }
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

export const compareHeapSnapshotFunctionsInternal2 = (before: Snapshot, after: Snapshot): readonly CompareResult[] => {
  const a = prepareFunctions(before)
  const b = prepareFunctions(after)
  const { itemsPerLocation, scriptIdOffset, lineOffset, columnOffset } = getLocationFieldOffsets(after.meta.location_fields)
  const map1 = a.map
  const map2 = b.map
  const locations2 = b.locations
  const newItems = getNewItems(map1, map2)
  const formattedItems = newItems.map((newItem: UniqueLocationWithDelta) => {
    const scriptId = locations2[newItem.index * itemsPerLocation + scriptIdOffset]
    const line = locations2[newItem.index * itemsPerLocation + lineOffset]
    const column = locations2[newItem.index * itemsPerLocation + columnOffset]
    return {
      column,
      count: newItem.count,
      delta: newItem.delta,
      line,
      scriptId,
    }
  })
  const sorted = formattedItems.toSorted((a, b) => b.count - a.count)
  return sorted
}
