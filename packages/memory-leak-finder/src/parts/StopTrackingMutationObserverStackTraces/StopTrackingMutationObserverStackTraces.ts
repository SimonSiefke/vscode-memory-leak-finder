import type { Session } from '../Session/Session.ts'
import * as ConstructorKey from '../ConstructorKey/ConstructorKey.ts'
import * as StopTrackingConstructorStackTraces from '../StopTrackingConstructorStackTraces/StopTrackingConstructorStackTraces.ts'

/**
 * @param {unknown} session
 * @param {string} objectGroup
 * @returns {Promise<unknown>}
 */
export const stopTrackingMutationObserverStackTraces = async (session: Session, objectGroup: string) => {
  await StopTrackingConstructorStackTraces.stopTrackingEventListenerStackTraces(session, objectGroup, ConstructorKey.MutationObserver)
}
