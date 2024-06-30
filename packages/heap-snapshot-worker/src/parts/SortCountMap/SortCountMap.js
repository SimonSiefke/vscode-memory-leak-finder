import * as Arrays from '../Arrays/Arrays.js'
import * as Assert from '../Assert/Assert.js'

const compareFunction = (a, b) => {
  return b.count - a.count || a.name.localeCompare(b.name)
}

export const sortCountMap = (items) => {
  Assert.array(items)
  const sorted = Arrays.toSorted(items, compareFunction)
  return sorted
}
