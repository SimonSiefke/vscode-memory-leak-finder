import * as GetObjectCount from '../GetObjectCount/GetObjectCount.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'
import type { Session } from '../Session/Session.ts'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getTextDecoderCount = async (session: Session, objectGroup: string) => {
  return GetObjectCount.getObjectCount(session, PrototypeExpression.TextDecoder, objectGroup)
}
