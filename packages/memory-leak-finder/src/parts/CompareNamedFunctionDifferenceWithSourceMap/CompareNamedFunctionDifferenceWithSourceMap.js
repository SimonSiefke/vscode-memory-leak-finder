import * as Assert from '../Assert/Assert.js'
import * as CompareFunctionDifference from '../CompareFunctionDifference/CompareFunctionDifference.js'

const addSourceMapsToFunctionDifference = (baseDifference) => {
  // TODO add sourceMaps
  return baseDifference
}

export const compareFunctionDifference = async (before, after) => {
  Assert.array(before)
  Assert.array(after)
  const baseDifference = CompareFunctionDifference.compareFunctionDifference(before, after)
  const difference = await addSourceMapsToFunctionDifference(baseDifference)
  return difference
}
