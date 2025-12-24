import * as Assert from '../Assert/Assert.ts'
import * as CleanInstanceCounts from '../CleanInstanceCounts/CleanInstanceCounts.ts'
import * as GetConstructorLocations from '../GetConstructorLocations/GetConstructorLocations.ts'
import * as GetInstanceCountArray from '../GetInstanceCountArray/GetInstanceCountArray.ts'
import * as GetInstanceCountMap from '../GetInstanceCountMap/GetInstanceCountMap.ts'
import * as GetInstances from '../GetInstances/GetInstances.ts'
import type { Session } from '../Session/Session.ts'

export const getInstanceCountsWithSourceMap = async (session: Session, objectGroup, scriptMap) => {
  Assert.object(session)
  Assert.string(objectGroup)
  Assert.object(scriptMap)
  const objects = await GetInstances.getInstances(session, objectGroup)
  const map = await GetInstanceCountMap.getInstanceCountMap(session, objectGroup, objects)
  const fnResult1 = await GetInstanceCountArray.getInstanceCountArray(session, objectGroup, map)
  const fnResult2 = await GetConstructorLocations.getConstructorLocations(session, objectGroup, map)
  const cleanInstances = CleanInstanceCounts.cleanInstanceCounts(fnResult1, fnResult2, scriptMap)
  return cleanInstances
}
