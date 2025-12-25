import type { Session } from '../Session/Session.ts'
import * as GetConstructorInstances from '../GetConstructorInstances/GetConstructorInstances.ts'

/**
 *
 * @param {any} session
 * @returns {Promise<any>}
 */
export const getWidgets = async (session: Session, objectGroup: string) => {
  return GetConstructorInstances.getConstructorInstances(session, objectGroup, 'Widget')
}
