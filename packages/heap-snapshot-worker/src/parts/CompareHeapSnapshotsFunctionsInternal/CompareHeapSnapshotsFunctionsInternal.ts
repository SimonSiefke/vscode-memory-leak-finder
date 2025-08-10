import { getLocationFieldOffsets } from '../GetLocationFieldOffsets/GetLocationFieldOffsets.js'

interface EmptyItem {
  count: number
}

interface MapItem {
  count: number
  index: number
}

interface Result {
  map: Record<string, MapItem>
  locations: any
}

interface LocationFields {
  [key: string]: any
}

interface ComparisonResult {
  column: number
  count: number
  delta: number
  line: number
  scriptId: number
}

const emptyItem: EmptyItem = {
  count: 0,
}

export const compareHeapSnapshotFunctionsInternal = (
  result1: Result,
  result2: Result,
  locationFields: LocationFields,
): ComparisonResult[] => {
  const { itemsPerLocation, scriptIdOffset, lineOffset, columnOffset } = getLocationFieldOffsets(locationFields)
  const map1 = result1.map
  const map2 = result2.map
  const locations2 = result2.locations
  const array: ComparisonResult[] = []
  for (const key of Object.keys(map2)) {
    const oldItem = map1[key] || emptyItem
    const newItem = map2[key]
    const delta = newItem.count - oldItem.count
    if (delta > 0) {
      const scriptId = locations2[newItem.index * itemsPerLocation + scriptIdOffset]
      const line = locations2[newItem.index * itemsPerLocation + lineOffset]
      const column = locations2[newItem.index * itemsPerLocation + columnOffset]
      array.push({
        column,
        count: newItem.count,
        delta,
        line,
        scriptId,
      })
    }
  }
  array.sort((a, b) => b.count - a.count)
  return array
}
