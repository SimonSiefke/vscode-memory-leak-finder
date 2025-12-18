import * as GetConstructors from '../GetConstructors/GetConstructors.ts'
import * as GetInstances from '../GetInstances/GetInstances.ts'
import * as SpyOnConstructors from '../SpyOnConstructors/SpyOnConstructors.ts'

// TODO
// 1. find all instances
// 2. modify constructor to point to custom class
//    that captures stack trace on creation
//    and calls the original prototype constructor

export const startTrackingInstanceCounts = async (session, objectGroup) => {
  const objects = await GetInstances.getInstances(session, objectGroup)
  const constructors = await GetConstructors.getConstructors(session, objectGroup, objects.objectId)
  await SpyOnConstructors.spyOnContructors(session, objectGroup, constructors.objectId)
}
