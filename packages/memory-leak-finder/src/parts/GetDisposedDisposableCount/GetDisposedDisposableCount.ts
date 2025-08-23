import type { Session } from '../Session/Session.ts'
import * as GetDisposedDisposables from '../GetDisposedDisposables/GetDisposedDisposables.ts'
import * as GetRemoteObjectLength from '../GetRemoteObjectLength/GetRemoteObjectLength.ts'

export const getDisposedDisposableCount = async (session: Session, objectGroup: string): Promise<number> => {
  const fnResult1 = await GetDisposedDisposables.getDisposedDisposables(session, objectGroup)
  const fnResult2 = await GetRemoteObjectLength.getRemoteObjectLength(session, fnResult1.objectId, objectGroup)
  return fnResult2
}
