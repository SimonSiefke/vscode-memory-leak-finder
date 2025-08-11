import * as ConstructorKey from '../ConstructorKey/ConstructorKey.ts'
import * as StopTrackingConstructorStackTraces from '../StopTrackingConstructorStackTraces/StopTrackingConstructorStackTraces.ts'

/**
 * @param {any} session
 * @param {string} objectGroup
 * @returns {Promise<any>}
 */
export const stopTrackingMutationObserverStackTraces = async (session, objectGroup) => {
  await StopTrackingConstructorStackTraces.stopTrackingEventListenerStackTraces(session, objectGroup, ConstructorKey.MutationObserver)
}
