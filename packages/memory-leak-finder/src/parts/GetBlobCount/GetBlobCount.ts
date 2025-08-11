import * as GetObjectCount from '../GetObjectCount/GetObjectCount.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getBlobCount = async (session, objectGroup) => {
  return GetObjectCount.getObjectCount(session, PrototypeExpression.Blob, objectGroup)
}
