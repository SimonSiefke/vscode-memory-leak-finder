import * as GetCodeEditorWidgets from '../GetCodeEditorWidgets/GetCodeEditorWidgets.js'
import * as GetRemoteObjectLength from '../GetRemoteObjectLength/GetRemoteObjectLength.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getCodeEditorWidgetCount = async (session, objectGroup) => {
  const fnResult1 = await GetCodeEditorWidgets.getCodeEditorWidgets(session, objectGroup)
  const fnResult2 = await GetRemoteObjectLength.getRemoteObjectLength(session, fnResult1.objectId, objectGroup)
  return fnResult2
}
