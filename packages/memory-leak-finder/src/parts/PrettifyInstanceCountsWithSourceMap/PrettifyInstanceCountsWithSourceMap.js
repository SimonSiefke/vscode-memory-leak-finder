import * as Arrays from '../Arrays/Arrays.js'
import * as Assert from '../Assert/Assert.js'
import * as CompareInstance from '../CompareInstance/CompareInstance.js'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.js'

const cleanInstance = (instance) => {
  const { name, originalName, count } = instance
  return {
    name: originalName || name,
    count,
  }
}

export const prettifyInstanceCountsWithSourceMap = async (instances) => {
  Assert.array(instances)
  const classNames = true
  const cleanPrettyInstances = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(instances, classNames)
  const sorted = Arrays.toSorted(cleanPrettyInstances, CompareInstance.compareInstance)
  const clean = sorted.map(cleanInstance)
  return clean
}
