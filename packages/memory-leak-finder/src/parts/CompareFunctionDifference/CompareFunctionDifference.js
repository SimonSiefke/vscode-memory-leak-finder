import * as AddFunctionLocationsToFunctions from '../AddFunctionLocationsToFunctions/AddFunctionLocationsToFunctions.js'
import * as Assert from '../Assert/Assert.js'

export const compareFunctionDifference = (before, after) => {
  Assert.object(after)
  const { result, scriptMap } = after
  const withLocations = AddFunctionLocationsToFunctions.addFunctionLocationsToFunctions(result, scriptMap)
  return withLocations
}
