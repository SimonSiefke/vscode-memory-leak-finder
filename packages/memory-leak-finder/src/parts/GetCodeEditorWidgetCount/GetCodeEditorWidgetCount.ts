import * as GetConstructorInstanceCount from '../GetConstructorInstanceCount/GetConstructorInstanceCount.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getCodeEditorWidgetCount = async (session, objectGroup) => {
  return GetConstructorInstanceCount.getConstructorInstanceCount(session, objectGroup, 'CodeEditorWidget')
}
