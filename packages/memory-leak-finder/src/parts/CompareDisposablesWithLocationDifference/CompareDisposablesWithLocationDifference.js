import * as CompareDisposablesWithLocation from '../CompareDisposablesWithLocation/CompareDisposablesWithLocation.js'

const hasDifference = (item) => {
  return item.delta > 0
}

export const compareDisposablesWithLocationDifference = async (before, after) => {
  const result = await CompareDisposablesWithLocation.compareDisposablesWithLocation(before, after)
  const filtered = result.filter(hasDifference)
  return filtered
}
