import * as GetStrings from '../GetStrings/GetStrings.js'
/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getNumberCount = async (session, objectGroup) => {
  const numbers = await GetStrings.getStrings(session, objectGroup)
  const numberCount = numbers.length
  return numberCount
}
