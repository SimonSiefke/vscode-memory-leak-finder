import * as ConstructorKey from '../ConstructorKey/ConstructorKey.ts'
import * as StopTrackingConstructorStackTraces from '../StopTrackingConstructorStackTraces/StopTrackingConstructorStackTraces.ts'
import type { Session } from '../Session/Session.ts'

/**
 * @param {any} session
 * @param {string} objectGroup
 * @returns {Promise<any>}
 */
export const stopTrackingMutationObserverStackTraces = async (session: Session, objectGroup: string) => {
  await StopTrackingConstructorStackTraces.stopTrackingEventListenerStackTraces(session, objectGroup, ConstructorKey.MutationObserver)
}
