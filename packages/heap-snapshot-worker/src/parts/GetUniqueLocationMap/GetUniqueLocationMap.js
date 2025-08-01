import { getLocationKey } from '../GetLocationKey/GetLocationKey.js'

export const getUniqueLocationMap = (locations, itemsPerLocation, scriptIdOffset, lineOffset, columnOffset) => {
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
