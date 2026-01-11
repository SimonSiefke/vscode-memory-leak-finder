import type { Session } from '../Session/Session.ts'
import * as GetObjectCount from '../GetObjectCount/GetObjectCount.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

export const getAbortControllerCount = async (session: Session, objectGroup: string): Promise<number> => {
  const count = await GetObjectCount.getObjectCount(session, PrototypeExpression.AbortController, objectGroup)
  return count
}
