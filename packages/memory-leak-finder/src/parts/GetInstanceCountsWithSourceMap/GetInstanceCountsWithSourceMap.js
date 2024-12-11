import * as Assert from '../Assert/Assert.js'
import * as CleanInstanceCounts from '../CleanInstanceCounts/CleanInstanceCounts.js'
import * as GetConstructorLocations from '../GetConstructorLocations/GetConstructorLocations.js'
import * as GetInstanceCountArray from '../GetInstanceCountArray/GetInstanceCountArray.js'
import * as GetInstanceCountMap from '../GetInstanceCountMap/GetInstanceCountMap.js'
import * as GetInstances from '../GetInstances/GetInstances.js'

export const getInstanceCountsWithSourceMap = async (session, objectGroup, scriptMap) => {
  Assert.object(session)
  Assert.string(objectGroup)
  Assert.object(scriptMap)
  console.time('objects')
  const objects = await GetInstances.getInstances(session, objectGroup)
  console.timeEnd('objects')
  console.time('map')
  const map = await GetInstanceCountMap.getInstanceCountMap(session, objectGroup, objects)
  console.timeEnd('map')
  console.log('objects size', map)
  console.time('array')
  const fnResult1 = await GetInstanceCountArray.getInstanceCountArray(session, objectGroup, map)
  console.timeEnd('array')
  console.time('constructor')
  const fnResult2 = await GetConstructorLocations.getConstructorLocations(session, objectGroup, map)
  console.timeEnd('constructor')
  console.time('clean')
  const cleanInstances = CleanInstanceCounts.cleanInstanceCounts(fnResult1, fnResult2, scriptMap)
  console.timeEnd('clean')
  return cleanInstances
}
