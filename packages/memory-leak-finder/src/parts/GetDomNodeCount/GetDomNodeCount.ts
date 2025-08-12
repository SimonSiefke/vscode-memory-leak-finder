import * as GetObjectCount from '../GetObjectCount/GetObjectCount.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getDomNodeCount = (session, objectGroup) => {
  return GetObjectCount.getObjectCount(session, PrototypeExpression.HtmlElement)
}
