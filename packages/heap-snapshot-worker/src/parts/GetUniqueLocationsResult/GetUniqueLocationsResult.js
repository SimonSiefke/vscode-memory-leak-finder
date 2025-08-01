const ITEMS_PER_LOCATION = 4
const ITEMS_PER_RESULT = 5

export const getUniqueLocationsResult = (locationMap, locations) => {
  const values = Object.values(locationMap)

  const result = new Uint32Array(values.length * ITEMS_PER_RESULT)
  for (const value of values) {
    const { count, index } = value
    const objectIndex = locations[index * ITEMS_PER_LOCATION]
    const scriptId = locations[index * ITEMS_PER_LOCATION + 1]
    const line = locations[index * ITEMS_PER_LOCATION + 2]
    const column = locations[index * ITEMS_PER_LOCATION + 3]
    result[index * ITEMS_PER_RESULT] = objectIndex
    result[index * ITEMS_PER_RESULT + 1] = scriptId
    result[index * ITEMS_PER_RESULT + 2] = line
    result[index * ITEMS_PER_RESULT + 3] = column
    result[index * ITEMS_PER_RESULT + 4] = count
  }

  return result
}
