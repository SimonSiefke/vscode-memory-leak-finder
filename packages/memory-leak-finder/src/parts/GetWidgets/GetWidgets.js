import * as GetConstructorInstances from '../GetConstructorInstances/GetConstructorInstances.js'

/**
 *
 * @param {any} session
 * @returns {Promise<any>}
 */
export const getWidgets = async (session, objectGroup) => {
  return GetConstructorInstances.getConstructorInstances(session, objectGroup, 'Widget')
}
