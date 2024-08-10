import * as GetUserStrings from '../GetUserStrings/GetUserStrings.js'
/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getUserStringCount = async (session, objectGroup) => {
  const strings = await GetUserStrings.getUserStrings(session, objectGroup)
  const stringCount = strings.length
  return stringCount
}
