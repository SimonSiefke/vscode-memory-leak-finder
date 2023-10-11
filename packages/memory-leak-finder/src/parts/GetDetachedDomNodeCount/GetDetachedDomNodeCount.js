import * as GetDescriptorCount from '../GetDescriptorCount/GetDescriptorCount.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'
/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getDetachedDomNodeCount = (session) => {
  return GetDescriptorCount.getDescriptorCount(session, PrototypeExpression.Node)
}
