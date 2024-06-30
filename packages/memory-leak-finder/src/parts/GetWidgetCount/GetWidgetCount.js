import * as GetRemoteObjectLength from '../GetRemoteObjectLength/GetRemoteObjectLength.js'
import * as GetWidgets from '../GetWidgets/GetWidgets.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getWidgetCount = async (session, objectGroup) => {
  const fnResult1 = await GetWidgets.getWidgets(session, objectGroup)
  const fnResult2 = await GetRemoteObjectLength.getRemoteObjectLength(session, fnResult1.objectId, objectGroup)
  return fnResult2
}
