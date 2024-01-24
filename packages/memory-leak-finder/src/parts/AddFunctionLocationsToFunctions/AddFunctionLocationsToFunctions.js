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
  const results = []
  for (const functionLocation of functionLocations) {
    results.push(addFunctionLocationToFunction(functionLocation, scriptMap))
  }
  return results
}
