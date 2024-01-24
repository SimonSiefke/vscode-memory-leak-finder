import * as AddFunctionLocationsToFunctions from '../AddFunctionLocationsToFunctions/AddFunctionLocationsToFunctions.js'
import * as Arrays from '../Arrays/Arrays.js'
import * as Assert from '../Assert/Assert.js'
import * as GetUrl from '../FormatUrl/FormatUrl.js'

const aggregateFunctionLocations = (functionLocations) => {
  const map = Object.create(null)
  for (const functionLocation of functionLocations) {
    const { url, lineNumber, columnNumber } = functionLocation
    const key = GetUrl.formatUrl(url, lineNumber, columnNumber)
    map[key] ||= 0
    map[key]++
  }
  return map
}

// const sortArray = (array, compared)

const compareElement = (a, b) => {
  return b.value - a.value
}

const sortMap = (map) => {
  const array = []
  for (const [key, value] of Object.entries(map)) {
    array.push({ key, value })
  }
  const sorted = Arrays.toSorted(array, compareElement)
  const sortedMap = Object.create(null)
  for (const element of sorted) {
    sortedMap[element.key] = element.value
  }
  return sortedMap
}

export const compareFunctionDifference = (before, after) => {
  Assert.object(after)
  const { result, scriptMap } = after
  const withLocations = AddFunctionLocationsToFunctions.addFunctionLocationsToFunctions(result, scriptMap)
  const aggregated = aggregateFunctionLocations(withLocations)
  const sorted = sortMap(aggregated)
  return sorted
}
