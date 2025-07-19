import { VError } from '@lvce-editor/verror'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getEditContextCount = async (session, objectGroup) => {
  try {
    // TODO compute edit context count
    return 0
  } catch (error) {
    throw new VError(error, `Failed to get edit context count`)
  }
}
