import * as GetStrings from '../GetStrings/GetStrings.js'
/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getStringCount = async (session, objectGroup, id) => {
  const strings = await GetStrings.getStrings(session, objectGroup, id)
  const stringCount = strings.length
  return stringCount
}
