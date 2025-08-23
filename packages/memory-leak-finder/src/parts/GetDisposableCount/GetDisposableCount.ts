import type { Session } from '../Session/Session.ts'
import * as GetDisposables from '../GetDisposables/GetDisposables.ts'
import * as GetRemoteObjectLength from '../GetRemoteObjectLength/GetRemoteObjectLength.ts'

export const getDisposableCount = async (session: Session, objectGroup: string): Promise<number> => {
  const fnResult1 = await GetDisposables.getDisposables(session, objectGroup)
  const fnResult2 = await GetRemoteObjectLength.getRemoteObjectLength(session, fnResult1.objectId, objectGroup)
  return fnResult2
}
