import * as Arrays from '../Arrays/Arrays.js'
import * as Assert from '../Assert/Assert.js'

const compareItem = (a, b) => {
  return b.count - a.count
}

export const sortCountMap = (items) => {
  Assert.array(items)
  const sorted = Arrays.toSorted(items, compareItem)
  return sorted
}
