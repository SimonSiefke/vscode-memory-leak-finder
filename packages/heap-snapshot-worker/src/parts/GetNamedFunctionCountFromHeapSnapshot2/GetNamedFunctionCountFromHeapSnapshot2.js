import { getUniqueLocationMap } from '../GetUniqueLocationMap/GetUniqueLocationMap.js'
import { getUniqueLocationsResult } from '../GetUniqueLocationsResult/GetUniqueLocationsResult.js'

/**
 * @param {Uint32Array} locations
 * @param {Object} scriptMap - Optional: Map of scriptIdIndex to script info with url
 * @returns {Uint32Array<ArrayBuffer>}
 */
export const getNamedFunctionCountFromHeapSnapshot2 = (locations, scriptMap = {}) => {
  const locationMap = getUniqueLocationMap(locations, scriptMap)
  const result = getUniqueLocationsResult(locationMap, locations)
  return result
}
