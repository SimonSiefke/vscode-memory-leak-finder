import got, { HTTPError } from 'got'
import { VError } from '../VError/VError.js'

/**
 *
 * @param {string} url
 * @returns
 */
export const getJsonList = async (url) => {
  try {
    const jsonUrl = `${url}/json/list`
    const data = await got(jsonUrl, { responseType: 'json' }).json()
    return data
  } catch (error) {
    if (error && error instanceof HTTPError) {
      throw new Error(`Failed to connect to debugger: ${error.message}`)
    }
    // @ts-ignore
    throw new VError(error, `Failed to connect to debugger`)
  }
}
