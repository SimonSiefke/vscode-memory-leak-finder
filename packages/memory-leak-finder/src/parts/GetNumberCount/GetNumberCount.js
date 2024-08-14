import * as GetNumbers from '../GetNumbers/GetNumbers.js'
/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getNumberCount = async (session, objectGroup) => {
  const numbers = await GetNumbers.getNumbers(session, objectGroup)
  const numberCount = numbers.length
  return numberCount
}
