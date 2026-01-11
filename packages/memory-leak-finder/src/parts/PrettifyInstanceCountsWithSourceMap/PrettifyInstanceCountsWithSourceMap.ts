import * as Arrays from '../Arrays/Arrays.ts'
import * as Assert from '../Assert/Assert.ts'
import * as CompareInstance from '../CompareInstance/CompareInstance.ts'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.ts'

const cleanInstance = (instance) => {
  const { beforeCount, count, name, originalName, originalStack, stack } = instance
  return {
    beforeCount,
    count,
    name: originalName || name,
    url: originalStack?.[0] || stack?.[0] || '',
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
