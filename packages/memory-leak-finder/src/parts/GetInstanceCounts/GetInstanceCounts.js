import * as Assert from '../Assert/Assert.js'
import * as CleanInstanceCounts from '../CleanInstanceCounts/CleanInstanceCounts.js'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetConstructorLocations from '../GetConstructorLocations/GetConstructorLocations.js'
import * as GetInstanceCountArray from '../GetInstanceCountArray/GetInstanceCountArray.js'
import * as GetInstanceCountMap from '../GetInstanceCountMap/GetInstanceCountMap.js'
import * as GetInstances from '../GetInstances/GetInstances.js'

export const getInstanceCounts = async (session, objectGroup, scriptMap) => {
  Assert.object(session)
  Assert.string(objectGroup)
  Assert.object(scriptMap)
  const objects = await GetInstances.getInstances(session, objectGroup)
  const map = await GetInstanceCountMap.getInstanceCountMap(session, objectGroup, objects)
  const mapSize = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
    const map = this
    return map.size ?? 11
  }`,
    returnByValue: true,
    objectId: map.objectId,
  })
  const fnResult1 = await GetInstanceCountArray.getInstanceCountArray(session, objectGroup, map)
  const fnResult2 = await GetConstructorLocations.getConstructorLocations(session, objectGroup, map)
  // const index = fnResult2.findIndex((x) => !x)
  // const i1 = fnResult1[index]
  // console.log({ i1, index, aLength: fnResult1.length, bLength: fnResult2.length, objectsLength: objects, mapSize })
  // const cleanInstances = CleanInstanceCounts.cleanInstanceCounts(fnResult1, fnResult2, scriptMap)
  // console.log({ cleanInstances })
  return fnResult1
}
