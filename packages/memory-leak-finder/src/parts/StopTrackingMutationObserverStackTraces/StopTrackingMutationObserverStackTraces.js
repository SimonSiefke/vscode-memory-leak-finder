import * as ConstructorKey from '../ConstructorKey/ConstructorKey.js'
import * as StopTrackingConstructorStackTraces from '../StopTrackingConstructorStackTraces/StopTrackingConstructorStackTraces.js'

/**
 * @param {any} session
 * @param {string} objectGroup
 * @returns {Promise<any>}
 */
export const stopTrackingMutationObserverStackTraces = async (session, objectGroup) => {
  await StopTrackingConstructorStackTraces.stopTrackingEventListenerStackTraces(session, objectGroup, ConstructorKey.MutationObserver)
}
