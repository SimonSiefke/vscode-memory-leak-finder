import * as Arrays from '../Arrays/Arrays.js'

const getCount = (instance) => {
  return instance.count
}

export const getTotalInstanceCounts = (instances) => {
  const counts = instances.map(getCount)
  return Arrays.sum(counts)
}
