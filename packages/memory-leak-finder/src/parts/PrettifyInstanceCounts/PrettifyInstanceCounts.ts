import * as Arrays from '../Arrays/Arrays.ts'
import * as Assert from '../Assert/Assert.ts'
import * as CompareInstance from '../CompareInstance/CompareInstance.ts'

export const prettifyInstanceCounts = (instances) => {
  Assert.array(instances)
  const prettyInstances = Arrays.toSorted(instances, CompareInstance.compareInstance)
  return prettyInstances
}
