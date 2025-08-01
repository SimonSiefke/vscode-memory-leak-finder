import { getLocationKey } from '../GetLocationKey/GetLocationKey.js'

const ITEMS_PER_LOCATION = 4
const scriptOffset = 1
const lineOffset = 2
const columnOffset = 3

export const getUniqueLocationMap = (locations) => {
  const locationMap = Object.create(null)
  for (let i = 0; i < locations.length; i += ITEMS_PER_LOCATION) {
    const scriptId = locations[i + scriptOffset]
    const lineIndex = locations[i + lineOffset]
    const columnIndex = locations[i + columnOffset]
    const key = getLocationKey(scriptId, lineIndex, columnIndex)
    if (key in locationMap) {
      locationMap[key].count++
    } else {
      locationMap[key] = {
        count: 1,
        index: i / ITEMS_PER_LOCATION,
      }
    }
  }
  return locationMap
}
