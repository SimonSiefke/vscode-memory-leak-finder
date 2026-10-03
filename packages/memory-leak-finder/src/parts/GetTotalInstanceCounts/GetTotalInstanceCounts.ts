import type { Dynamic } from '../Types/Types.ts'
import * as Arrays from '../Arrays/Arrays.ts'
const getCount = (instance: Dynamic) => {
  return instance.count
}
export const getTotalInstanceCounts = (instances: Dynamic) => {
  const counts = instances.map(getCount)
  return Arrays.sum(counts)
}
