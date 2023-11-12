import * as Arrays from '../Arrays/Arrays.js'
import * as Assert from '../Assert/Assert.js'
import * as CompareInstance from '../CompareInstance/CompareInstance.js'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.js'

export const prettifyInstanceCounts = async (instances) => {
  Assert.array(instances)
  const prettyInstances = Arrays.toSorted(instances, CompareInstance.compareInstance)
  const cleanPrettyInstances = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(prettyInstances)
  return cleanPrettyInstances
}
