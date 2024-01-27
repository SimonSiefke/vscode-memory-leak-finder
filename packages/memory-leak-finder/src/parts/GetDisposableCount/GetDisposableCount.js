import * as GetDisposables from '../GetDisposables/GetDisposables.js'
import * as GetRemoteObjectLength from '../GetRemoteObjectLength/GetRemoteObjectLength.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getDisposableCount = async (session, objectGroup) => {
  const fnResult1 = await GetDisposables.getDisposables(session, objectGroup)
  const fnResult2 = await GetRemoteObjectLength.getRemoteObjectLength(session, fnResult1.objectId, objectGroup)
  return fnResult2
}
