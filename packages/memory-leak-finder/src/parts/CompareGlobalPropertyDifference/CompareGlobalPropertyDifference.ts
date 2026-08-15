import * as Assert from '../Assert/Assert.ts'

export const compareGlobalPropertyDifference = (before: readonly string[], after: readonly string[]): readonly string[] => {
  Assert.array(before)
  Assert.array(after)
  const beforeSet = new Set(before)
  return after.filter((property) => !beforeSet.has(property)).toSorted()
}
