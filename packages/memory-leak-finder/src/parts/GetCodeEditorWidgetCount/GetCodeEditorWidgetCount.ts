import * as GetConstructorInstanceCount from '../GetConstructorInstanceCount/GetConstructorInstanceCount.ts'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getCodeEditorWidgetCount = async (session, objectGroup) => {
  return GetConstructorInstanceCount.getConstructorInstanceCount(session, objectGroup, 'CodeEditorWidget')
}
