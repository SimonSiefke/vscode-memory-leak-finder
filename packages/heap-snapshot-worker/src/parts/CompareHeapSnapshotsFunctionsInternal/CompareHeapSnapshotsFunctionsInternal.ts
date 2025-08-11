import { getLocationFieldOffsets } from '../GetLocationFieldOffsets/GetLocationFieldOffsets.ts'

const emptyItem = {
  count: 0,
}

export const compareHeapSnapshotFunctionsInternal = (result1: any, result2: any, locationFields: readonly string[]): any[] => {
  const { itemsPerLocation, scriptIdOffset, lineOffset, columnOffset } = getLocationFieldOffsets(locationFields)
  const map1 = result1.map
  const map2 = result2.map
  const locations2 = result2.locations
  const array: any[] = []
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
