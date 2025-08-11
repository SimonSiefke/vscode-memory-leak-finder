import * as GetUserStrings from '../GetUserStrings/GetUserStrings.js'
/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getUserStringCount = async (session, objectGroup, id) => {
  const strings = await GetUserStrings.getUserStrings(session, objectGroup, id)
  const stringCount = strings.length
  return stringCount
}
