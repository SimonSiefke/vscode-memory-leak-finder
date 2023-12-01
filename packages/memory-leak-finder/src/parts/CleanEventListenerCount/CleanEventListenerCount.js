import * as Arrays from '../Arrays/Arrays.js'
import * as Assert from '../Assert/Assert.js'

const compareEventListenerCount = (a, b) => {
  return b.count - a.count || a.name.localeCompare(b.name)
}

export const cleanEventListenerCount = (array) => {
  Assert.array(array)
  return Arrays.toSorted(array, compareEventListenerCount)
}
