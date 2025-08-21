export const createCountMap = (array, key) => {
  const map = Object.create(null)
  for (const element of array) {
    map[element[key]] = element.count
  }
  return map
}
