import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'
import { getObjectCount } from './PrototypeCount.js'

/**
 *
 * @param {import('@playwright/test').CDPSession} session
 * @returns {Promise<number>}
 */
export const getPromiseCount = async (session, objectGroup) => {
  const count = await getObjectCount(session, PrototypeExpression.Promise)
  return count
}
