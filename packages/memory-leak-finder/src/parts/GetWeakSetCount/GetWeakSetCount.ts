import * as GetObjectCount from '../GetObjectCount/GetObjectCount.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'
import type { Session } from '../Session/Session.ts'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getWeakSetCount = (session: Session) => {
  return GetObjectCount.getObjectCount(session, PrototypeExpression.WeakSet)
}
