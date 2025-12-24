import * as GetConstructorInstanceCount from '../GetConstructorInstanceCount/GetConstructorInstanceCount.ts'
import type { Session } from '../Session/Session.ts'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getWidgetCount = async (session: Session, objectGroup: string) => {
  return GetConstructorInstanceCount.getConstructorInstanceCount(session, objectGroup, 'Widget')
}
