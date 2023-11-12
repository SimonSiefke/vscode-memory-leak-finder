import * as Assert from '../Assert/Assert.js'
import * as CompareInstance from '../CompareInstance/CompareInstance.js'

export const prettifyInstanceCounts = (instances) => {
  Assert.array(instances)
  const prettyInstances = [...instances].sort(CompareInstance.compareInstance)
  return prettyInstances
}
