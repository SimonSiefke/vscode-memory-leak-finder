import * as Arrays from '../Arrays/Arrays.js'

const getFunctionKey = (value) => {
  return `${value.scriptId}:${value.lineNumber}:${value.columnNumber}`
}

const compareCount = (a, b) => {
  return b.count - a.count
}

export const cleanFunctionLocations = (counts, functionObjectIds, functionLocations) => {
  const countMap = Object.create(null)
  const instances = []
  for (const functionLocation of functionLocations) {
    const key = getFunctionKey(functionLocation)
    if (countMap[key]) {
      countMap[key]++
    } else {
      instances.push({
        ...functionLocation,
        count: 0,
      })
      countMap[key] = 1
    }
  }
  for (const instance of instances) {
    const key = getFunctionKey(instance)
    instance.count = countMap[key]
  }
  const sorted = Arrays.toSorted(instances, compareCount)
  return sorted
}
