import type { Dynamic } from '../Types/Types.ts'
import * as Arrays from '../Arrays/Arrays.ts'
import * as Assert from '../Assert/Assert.ts'
const compareItem = (a: Dynamic, b: Dynamic) => {
  return b.count - a.count
}
export const sortCountMap = (items: Dynamic) => {
  Assert.array(items)
  const sorted = Arrays.toSorted(items, compareItem)
  return sorted
}
