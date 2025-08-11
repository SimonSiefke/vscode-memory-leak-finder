import * as GetObjectCount from '../GetObjectCount/GetObjectCount.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getArrayCount = async (session, objectGroup) => {
  const count = await GetObjectCount.getObjectCount(session, PrototypeExpression.Array)
  return count
}
