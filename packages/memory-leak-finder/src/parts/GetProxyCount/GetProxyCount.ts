import { VError } from '@lvce-editor/verror'
import * as GetObjects from '../GetObjects/GetObjects.js'
import * as GetPropertyValues from '../GetPropertyValues/GetPropertyValues.js'
import * as IsProxy from '../IsProxy/IsProxy.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getProxyCount = async (session, objectGroup) => {
  try {
    const objects = await GetObjects.getObjects(session, objectGroup)
    const values = await GetPropertyValues.getPropertyValues(session, objectGroup, objects.objectId)
    const proxies = values.filter(IsProxy.isProxy)
    const proxyCount = proxies.length
    return proxyCount
  } catch (error) {
    throw new VError(error, `Failed to get proxy count`)
  }
}
