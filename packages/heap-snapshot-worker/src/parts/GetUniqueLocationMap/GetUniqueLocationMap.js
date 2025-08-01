const ITEMS_PER_LOCATION = 4

/**
 * @param {Uint32Array} locations
 * @returns {Map<string, {scriptIdIndex: number, lineIndex: number, columnIndex: number, count: number}>}
 */
export const getUniqueLocationMap = (locations, scriptMap = {}) => {
  const locationMap = Object.create(null)

  for (let i = 0; i < locations.length; i += ITEMS_PER_LOCATION) {
    const scriptIdIndex = locations[i + 1]
    const lineIndex = locations[i + 2]
    const columnIndex = locations[i + 3]

    // Get the URL from scriptMap, fallback to empty string if not found
    const script = scriptMap[scriptIdIndex]
    const url = script?.url || ''

    // Use the same key format as the original function: url:line:column
    const locationKey = `${url}:${lineIndex}:${columnIndex}`

    if (locationKey in locationMap) {
      locationMap[locationKey].count++
    } else {
      locationMap[locationKey] = {
        count: 1,
        index: i / ITEMS_PER_LOCATION,
      }
    }
  }

  return locationMap
}
