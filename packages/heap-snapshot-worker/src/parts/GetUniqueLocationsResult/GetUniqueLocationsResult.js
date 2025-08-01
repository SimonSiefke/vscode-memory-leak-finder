import { getLocationFieldOffsets } from '../GetLocationFieldOffsets/GetLocationFieldOffsets.js'

const ITEMS_PER_RESULT = 5

export const getUniqueLocationsResult = (locationMap, locations, locationFields) => {
  const { itemsPerLocation, objectIndexOffset, scriptIdOffset, lineOffset, columnOffset } = getLocationFieldOffsets(locationFields)
  const values = Object.values(locationMap)

  const result = new Uint32Array(values.length * ITEMS_PER_RESULT)
  let resultIndex = 0
  for (const value of values) {
    const { count, index } = value
    const objectIndex = locations[index * itemsPerLocation + objectIndexOffset]
    const scriptId = locations[index * itemsPerLocation + scriptIdOffset]
    const line = locations[index * itemsPerLocation + lineOffset]
    const column = locations[index * itemsPerLocation + columnOffset]
    result[resultIndex * ITEMS_PER_RESULT] = objectIndex
    result[resultIndex * ITEMS_PER_RESULT + 1] = scriptId
    result[resultIndex * ITEMS_PER_RESULT + 2] = line
    result[resultIndex * ITEMS_PER_RESULT + 3] = column
    result[resultIndex * ITEMS_PER_RESULT + 4] = count
    resultIndex++
  }

  return result
}
