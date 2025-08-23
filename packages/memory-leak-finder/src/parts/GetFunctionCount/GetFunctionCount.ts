import type { Session } from '../Session/Session.ts'
import * as GetObjectCount from '../GetObjectCount/GetObjectCount.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

export const getFunctionCount = async (session: Session, objectGroup: string): Promise<number> => {
  const count = await GetObjectCount.getObjectCount(session, PrototypeExpression.Function)
  return count
}
