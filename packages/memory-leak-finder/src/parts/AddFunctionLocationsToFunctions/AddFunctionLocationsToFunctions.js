import * as Arrays from '../Arrays/Arrays.js'

const empty = {
  url: '',
  sourceMapUrl: '',
}

const addFunctionLocationToFunction = (functionLocation, scriptMap) => {
  const { scriptId, lineNumber, columnNumber } = functionLocation
  const original = scriptMap[scriptId] || empty
  return {
    url: original.url,
    lineNumber,
    columnNumber,
  }
}

export const addFunctionLocationsToFunctions = (functionLocations, scriptMap) => {
  const results = Arrays.contextMap(functionLocations, addFunctionLocationToFunction, scriptMap)
  return results
}
