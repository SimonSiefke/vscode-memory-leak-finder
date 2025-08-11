import * as GetConstructorInstanceCount from '../GetConstructorInstanceCount/GetConstructorInstanceCount.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getEmitterCount = async (session, objectGroup) => {
  return GetConstructorInstanceCount.getConstructorInstanceCount(session, objectGroup, 'Emitter')
}
