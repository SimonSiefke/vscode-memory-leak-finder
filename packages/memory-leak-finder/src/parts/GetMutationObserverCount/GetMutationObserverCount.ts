import type { Session } from '../Session/Session.ts'
import * as GetObjectCount from '../GetObjectCount/GetObjectCount.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

export const getMutationObserverCount = (session: Session): Promise<number> => {
  return GetObjectCount.getObjectCount(session, PrototypeExpression.MutationObserver)
}
