import * as GetObjectCount from '../GetObjectCount/GetObjectCount.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getRegexCount = async (session, objectGroup) => {
  const count = await GetObjectCount.getObjectCount(session, PrototypeExpression.Regex)
  return count
}
