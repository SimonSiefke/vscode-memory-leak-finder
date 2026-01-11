import type { Session } from '../Session/Session.ts'
import * as GetConstructorInstanceCount from '../GetConstructorInstanceCount/GetConstructorInstanceCount.ts'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getWidgetCount = async (session: Session, objectGroup: string) => {
  return GetConstructorInstanceCount.getConstructorInstanceCount(session, objectGroup, 'Widget')
}
