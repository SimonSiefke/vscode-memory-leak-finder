import type { Dynamic } from '../Types/Types.ts'
import * as CompareDisposablesWithLocation from '../CompareDisposablesWithLocation/CompareDisposablesWithLocation.ts'
const hasDifference = (item: Dynamic) => {
  return item.delta > 0
}
export const compareDisposablesWithLocationDifference = async (before: Dynamic, after: Dynamic) => {
  const result = await CompareDisposablesWithLocation.compareDisposablesWithLocation(before, after)
  const filtered = result.filter(hasDifference)
  return filtered
}
