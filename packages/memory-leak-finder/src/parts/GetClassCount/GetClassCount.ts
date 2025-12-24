import type { Session } from '../Session/Session.ts'
import * as GetConstructors from '../GetConstructors/GetConstructors.ts'
import * as GetInstances from '../GetInstances/GetInstances.ts'
import * as GetRemoteObjectLength from '../GetRemoteObjectLength/GetRemoteObjectLength.ts'

export const getClassCount = async (session: Session, objectGroup: string) => {
  const instances = await GetInstances.getInstances(session, objectGroup)
  const constructors = await GetConstructors.getConstructors(session, objectGroup, instances.objectId)
  const fnResult1 = await GetRemoteObjectLength.getRemoteObjectLength(session, constructors.objectId, objectGroup)
  return fnResult1
}
