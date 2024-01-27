import * as GetConstructors from '../GetConstructors/GetConstructors.js'
import * as GetInstances from '../GetInstances/GetInstances.js'
import * as GetRemoteObjectLength from '../GetRemoteObjectLength/GetRemoteObjectLength.js'

export const getClassCount = async (session, objectGroup) => {
  const instances = await GetInstances.getInstances(session, objectGroup)
  const constructors = await GetConstructors.getConstructors(session, objectGroup, instances.objectId)
  const fnResult1 = await GetRemoteObjectLength.getRemoteObjectLength(session, constructors.objectId, objectGroup)
  return fnResult1
}
