import { getLocationFieldOffsets } from '../GetLocationFieldOffsets/GetLocationFieldOffsets.ts'
import { getLocationKey } from '../GetLocationKey/GetLocationKey.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'
import type { UniqueLocationMap } from '../UniqueLocationMap/UniqueLocationMap.ts'

export const getUniqueLocationMap2 = (snapshot: Snapshot): UniqueLocationMap => {
  const { itemsPerLocation, scriptIdOffset, lineOffset, columnOffset } = getLocationFieldOffsets(snapshot.meta.location_fields)
  const { locations } = snapshot
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
