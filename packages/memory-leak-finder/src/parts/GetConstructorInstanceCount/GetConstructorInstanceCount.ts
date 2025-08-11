import * as GetConstructorInstances from '../GetConstructorInstances/GetConstructorInstances.js'
import * as GetRemoteObjectLength from '../GetRemoteObjectLength/GetRemoteObjectLength.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getConstructorInstanceCount = async (session, objectGroup, constructorName) => {
  const fnResult1 = await GetConstructorInstances.getConstructorInstances(session, objectGroup, constructorName)
  const count = await GetRemoteObjectLength.getRemoteObjectLength(session, fnResult1.objectId, objectGroup)
  return count
}
