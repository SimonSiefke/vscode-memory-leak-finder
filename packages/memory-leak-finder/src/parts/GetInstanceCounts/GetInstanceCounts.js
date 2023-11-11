import * as GetConstructorLocations from '../GetConstructorLocations/GetConstructorLocations.js'
import * as GetInstanceCountArray from '../GetInstanceCountArray/GetInstanceCountArray.js'
import * as GetInstances from '../GetInstances/GetInstances.js'

export const getInstanceCounts = async (session, objectGroup) => {
  const objects = await GetInstances.getInstances(session, objectGroup)
  const fnResult1 = await GetInstanceCountArray.getInstanceCountArray(session, objectGroup, objects)
  const fnResult2 = await GetConstructorLocations.getConstructorLocations(session, objectGroup, objects)
  console.log({ fnResult2 })
  return fnResult1
}
