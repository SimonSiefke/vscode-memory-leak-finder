import * as GetConstructorInstanceCount from '../GetConstructorInstanceCount/GetConstructorInstanceCount.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getMinimapCount = async (session, objectGroup) => {
  return GetConstructorInstanceCount.getConstructorInstanceCount(session, objectGroup, 'Minimap')
}
