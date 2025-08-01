import { getUniqueLocationMap } from '../GetUniqueLocationMap/GetUniqueLocationMap.js'
import { getUniqueLocationsResult } from '../GetUniqueLocationsResult/GetUniqueLocationsResult.js'
import { getLocationFieldOffsets } from '../GetLocationFieldOffsets/GetLocationFieldOffsets.js'

/**
 * @param {Uint32Array} locations
 * @param {Array<string>} locationFields
 * @returns {Uint32Array<ArrayBuffer>}
 */
export const getNamedFunctionCountFromHeapSnapshot2 = (locations, locationFields) => {
  const { itemsPerLocation, scriptIdOffset, lineOffset, columnOffset } = getLocationFieldOffsets(locationFields)
  const locationMap = getUniqueLocationMap(locations, itemsPerLocation, scriptIdOffset, lineOffset, columnOffset)
  const result = getUniqueLocationsResult(locationMap, locations, locationFields)
  return result
}
