import { getUniqueLocationMap } from '../GetUniqueLocationMap/GetUniqueLocationMap.js'

const ITEMS_PER_LOCATION = 4

/**
 * @param {Uint32Array} locations
 * @returns {Uint32Array<ArrayBuffer>}
 */
export const getNamedFunctionCountFromHeapSnapshot2 = (locations) => {
  // Create unique location map
  const locationMap = getUniqueLocationMap(locations)

  const values = Object.values(locationMap)

  const result = new Uint32Array(values.length * 4)
  for (const value of values) {
    const { count, index } = value
    const location = locations[index]
    result[index * ITEMS_PER_LOCATION] = location[index * ITEMS_PER_LOCATION]
    result[index * ITEMS_PER_LOCATION + 1] = location[index * ITEMS_PER_LOCATION + 1]
    result[index * ITEMS_PER_LOCATION + 2] = location[index * ITEMS_PER_LOCATION + 2]
    result[index * ITEMS_PER_LOCATION + 3] = count
  }

  return result
}
