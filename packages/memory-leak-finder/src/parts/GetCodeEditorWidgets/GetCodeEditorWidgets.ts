import * as GetConstructorInstances from '../GetConstructorInstances/GetConstructorInstances.ts'

/**
 *
 * @param {any} session
 * @returns {Promise<any>}
 */
export const getCodeEditorWidgets = async (session, objectGroup) => {
  return GetConstructorInstances.getConstructorInstances(session, objectGroup, 'CodeEditorWidget')
}
