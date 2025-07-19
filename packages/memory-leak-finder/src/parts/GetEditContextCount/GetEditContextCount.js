import { VError } from '@lvce-editor/verror'
import * as GetObjectCount from '../GetObjectCount/GetObjectCount.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getEditContextCount = async (session, objectGroup) => {
  try {
    return await GetObjectCount.getObjectCount(session, PrototypeExpression.EditContext, objectGroup)
  } catch (error) {
    throw new VError(error, `Failed to get edit context count`)
  }
}
