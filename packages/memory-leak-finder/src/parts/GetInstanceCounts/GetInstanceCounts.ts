import * as Assert from '../Assert/Assert.ts'
import * as GetInstanceCountArray from '../GetInstanceCountArray/GetInstanceCountArray.ts'
import * as GetInstanceCountMap from '../GetInstanceCountMap/GetInstanceCountMap.ts'
import * as GetInstances from '../GetInstances/GetInstances.ts'

export const getInstanceCounts = async (session, objectGroup) => {
  Assert.object(session)
  Assert.string(objectGroup)
  const objects = await GetInstances.getInstances(session, objectGroup)
  const map = await GetInstanceCountMap.getInstanceCountMap(session, objectGroup, objects)
  const fnResult1 = await GetInstanceCountArray.getInstanceCountArray(session, objectGroup, map)
  return fnResult1
}
