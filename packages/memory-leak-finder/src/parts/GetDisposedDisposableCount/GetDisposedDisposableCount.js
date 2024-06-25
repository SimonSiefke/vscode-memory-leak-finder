import * as GetDisposedDisposables from '../GetDisposedDisposables/GetDisposedDisposables.js'
import * as GetRemoteObjectLength from '../GetRemoteObjectLength/GetRemoteObjectLength.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getDisposedDisposableCount = async (session, objectGroup) => {
  const fnResult1 = await GetDisposedDisposables.getDisposedDisposables(session, objectGroup)
  const fnResult2 = await GetRemoteObjectLength.getRemoteObjectLength(session, fnResult1.objectId, objectGroup)
  return fnResult2
}
