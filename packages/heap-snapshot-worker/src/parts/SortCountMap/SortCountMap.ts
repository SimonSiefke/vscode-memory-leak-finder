import * as Arrays from '../Arrays/Arrays.ts'
import * as Assert from '../Assert/Assert.ts'

const compareItem = (a: any, b: any) => {
  return b.count - a.count
}

export const sortCountMap = (items: any) => {
  Assert.array(items)
  const sorted = Arrays.toSorted(items, compareItem)
  return sorted
}
