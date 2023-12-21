import * as Arrays from '../Arrays/Arrays.js'

const compareCount = (a, b) => {
  return b.count - a.count
}

export const cleanFunctionLocations = (names, counts, functionLocations) => {
  const instances = []
  for (let i = 0; i < functionLocations.length; i++) {
    const name = names[i]
    const count = counts[i]
    const functionLocation = functionLocations[i]
    instances.push({
      ...functionLocation,
      count,
      name,
    })
  }
  const sorted = Arrays.toSorted(instances, compareCount)
  return sorted
}
