import * as GetObjectCount from '../GetObjectCount/GetObjectCount.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getRegexCount = async (session, objectGroup) => {
  const count = await GetObjectCount.getObjectCount(session, PrototypeExpression.Regex, objectGroup)
  return count
}
