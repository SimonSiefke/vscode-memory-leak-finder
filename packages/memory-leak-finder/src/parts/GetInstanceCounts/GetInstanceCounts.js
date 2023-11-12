import * as Assert from '../Assert/Assert.js'
import * as GetInstanceCountArray from '../GetInstanceCountArray/GetInstanceCountArray.js'
import * as GetInstanceCountMap from '../GetInstanceCountMap/GetInstanceCountMap.js'
import * as GetInstances from '../GetInstances/GetInstances.js'

export const getInstanceCounts = async (session, objectGroup, scriptMap) => {
  Assert.object(session)
  Assert.string(objectGroup)
  Assert.object(scriptMap)
  const objects = await GetInstances.getInstances(session, objectGroup)
  const map = await GetInstanceCountMap.getInstanceCountMap(session, objectGroup, objects)
  const fnResult1 = await GetInstanceCountArray.getInstanceCountArray(session, objectGroup, map)
  return fnResult1
}
