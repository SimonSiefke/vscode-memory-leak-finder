import * as Assert from '../Assert/Assert.js'
import * as CompareInstance from '../CompareInstance/CompareInstance.js'
import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.js'

export const prettifyInstanceCountsWithSourceMap = async (instances) => {
  Assert.array(instances)
  const prettyInstances = [...instances].sort(CompareInstance.compareInstance)
  const classNames = true
  const cleanPrettyInstances = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(
    prettyInstances,
    classNames,
  )
  return cleanPrettyInstances
}
