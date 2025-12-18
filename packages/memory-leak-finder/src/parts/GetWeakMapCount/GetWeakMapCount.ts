import type { Session } from '../Session/Session.ts'
import * as GetObjectCount from '../GetObjectCount/GetObjectCount.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

export const getWeakMapCount = (session: Session, objectGroup: string): Promise<number> => {
  return GetObjectCount.getObjectCount(session, PrototypeExpression.WeakMap, objectGroup)
}
