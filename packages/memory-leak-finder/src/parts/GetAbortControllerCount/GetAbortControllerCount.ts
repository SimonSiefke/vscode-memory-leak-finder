import type { Session } from 'inspector/promises'
import * as GetObjectCount from '../GetObjectCount/GetObjectCount.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

export const getAbortControllerCount = async (session: Session, objectGroup: string): Promise<number> => {
  const count = await GetObjectCount.getObjectCount(session, PrototypeExpression.AbortController)
  return count
}
