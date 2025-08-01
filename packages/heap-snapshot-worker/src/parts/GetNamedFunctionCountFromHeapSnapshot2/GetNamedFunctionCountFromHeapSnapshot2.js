import { getUniqueLocationMap } from '../GetUniqueLocationMap/GetUniqueLocationMap.js'
import { getUniqueLocationsResult } from '../GetUniqueLocationsResult/GetUniqueLocationsResult.js'

/**
 * @param {Uint32Array} locations
 * @returns {Uint32Array<ArrayBuffer>}
 */
export const getNamedFunctionCountFromHeapSnapshot2 = (locations) => {
  const locationMap = getUniqueLocationMap(locations)
  const result = getUniqueLocationsResult(locationMap, locations)
  return result
}
