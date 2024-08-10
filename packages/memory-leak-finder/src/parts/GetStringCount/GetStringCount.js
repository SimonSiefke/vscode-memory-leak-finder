import * as GetStrings from '../GetStrings/GetStrings.js'
/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getStringCount = async (session, objectGroup) => {
  const strings = await GetStrings.getStrings(session, objectGroup)
  const stringCount = strings.length
  return stringCount
}
