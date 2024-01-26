import * as Assert from '../Assert/Assert.js'
import * as GetInstanceCountArray from '../GetInstanceCountArray/GetInstanceCountArray.js'
import * as GetInstanceCountMap from '../GetInstanceCountMap/GetInstanceCountMap.js'
import * as GetInstances from '../GetInstances/GetInstances.js'

export const getInstanceCountsWithConstructorLocations = async (session, objectGroup, scriptMap) => {
  Assert.object(session)
  Assert.string(objectGroup)
  const objects = await GetInstances.getInstances(session, objectGroup)
  const map = await GetInstanceCountMap.getInstanceCountMap(session, objectGroup, objects)
  const fnResult1 = await GetInstanceCountArray.getInstanceCountArray(session, objectGroup, map)
  // TODO for each instance, query constructor location
  return fnResult1
}
