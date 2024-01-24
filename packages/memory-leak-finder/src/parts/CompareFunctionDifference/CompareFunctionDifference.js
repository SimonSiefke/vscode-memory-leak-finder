import * as Assert from '../Assert/Assert.js'
import * as GetFunctionLocations from '../GetFunctionLocations/GetFunctionLocations.js'

export const compareFunctionDifference = (before, after) => {
  Assert.array(after)
  console.log({ after })
  return {
    after,
  }
}
