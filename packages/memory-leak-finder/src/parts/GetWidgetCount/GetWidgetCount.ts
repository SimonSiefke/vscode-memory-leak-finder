import * as GetConstructorInstanceCount from '../GetConstructorInstanceCount/GetConstructorInstanceCount.ts'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getWidgetCount = async (session, objectGroup) => {
  return GetConstructorInstanceCount.getConstructorInstanceCount(session, objectGroup, 'Widget')
}
