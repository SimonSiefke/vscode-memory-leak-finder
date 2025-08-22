import { getLocationKey } from '../GetLocationKey/GetLocationKey.ts'
import type { UniqueLocationMap } from '../UniqueLocationMap/UniqueLocationMap.ts'

export const getUniqueLocationMap = (
  locations: Uint32Array,
  itemsPerLocation: number,
  scriptIdOffset: number,
  lineOffset: number,
  columnOffset: number,
): UniqueLocationMap => {
  const locationMap = Object.create(null)
  for (let i = 0; i < locations.length; i += itemsPerLocation) {
    const scriptId = locations[i + scriptIdOffset]
    const lineIndex = locations[i + lineOffset]
    const columnIndex = locations[i + columnOffset]
    const key = getLocationKey(scriptId, lineIndex, columnIndex)
    if (key in locationMap) {
      locationMap[key].count++
    } else {
      locationMap[key] = {
        count: 1,
        index: i / itemsPerLocation,
      }
    }
  }
  return locationMap
}
