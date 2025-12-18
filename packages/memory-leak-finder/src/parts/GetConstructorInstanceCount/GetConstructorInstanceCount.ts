import type { Session } from '../Session/Session.ts'
import * as GetConstructorInstances from '../GetConstructorInstances/GetConstructorInstances.ts'
import * as GetRemoteObjectLength from '../GetRemoteObjectLength/GetRemoteObjectLength.ts'

export const getConstructorInstanceCount = async (
  session: Session,
  objectGroup: string,
  constructorName: string,
  allowFunctions: boolean = false,
): Promise<number> => {
  const fnResult1 = await GetConstructorInstances.getConstructorInstances(session, objectGroup, constructorName, allowFunctions)
  const count = await GetRemoteObjectLength.getRemoteObjectLength(session, fnResult1.objectId, objectGroup)
  return count
}
