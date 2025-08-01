const ITEMS_PER_LOCATION = 4

/**
 * @param {Uint32Array} locations
 * @returns {Map<string, {scriptIdIndex: number, lineIndex: number, columnIndex: number, count: number}>}
 */
export const getUniqueLocationMap = (locations) => {
  const locationMap = Object.create(null)
  for (let i = 0; i < locations.length; i += ITEMS_PER_LOCATION) {
    const scriptIdIndex = locations[i + 1]
    const lineIndex = locations[i + 2]
    const columnIndex = locations[i + 3]
    const locationKey = `${scriptIdIndex}:${lineIndex}:${columnIndex}`
    if (locationKey in locationMap) {
      locationMap[locationKey].count++
    } else {
      locationMap[locationKey] = {
        count: 0,
        index: i,
      }
    }
  }

  return locationMap
}
