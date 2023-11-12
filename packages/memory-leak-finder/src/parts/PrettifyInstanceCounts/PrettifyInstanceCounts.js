import * as Arrays from '../Arrays/Arrays.js'
import * as Assert from '../Assert/Assert.js'
import * as CompareInstance from '../CompareInstance/CompareInstance.js'

export const prettifyInstanceCounts = (instances) => {
  Assert.array(instances)
  const prettyInstances = Arrays.toSorted(instances, CompareInstance.compareInstance)
  return prettyInstances
}
