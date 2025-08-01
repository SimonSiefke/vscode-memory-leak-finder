const ITEMS_PER_LOCATION = 4
const ITEMS_PER_RESULT = 4

export const getUniqueLocationsResult = (locationMap, locations) => {
  const values = Object.values(locationMap)

  const result = new Uint32Array(values.length * 4)
  for (const value of values) {
    const { count, index } = value
    const location = locations[index]
    result[index * ITEMS_PER_RESULT] = location[index * ITEMS_PER_LOCATION]
    result[index * ITEMS_PER_RESULT + 1] = location[index * ITEMS_PER_LOCATION + 1]
    result[index * ITEMS_PER_RESULT + 2] = location[index * ITEMS_PER_LOCATION + 2]
    result[index * ITEMS_PER_RESULT + 3] = count
  }

  return result
}
