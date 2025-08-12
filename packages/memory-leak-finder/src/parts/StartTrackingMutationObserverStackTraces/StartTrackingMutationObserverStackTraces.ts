import * as ConstructorKey from '../ConstructorKey/ConstructorKey.ts'
import * as StartTrackingConstructorStackTraces from '../StartTrackingConstructorStackTraces/StartTrackingConstructorStackTraces.ts'

/**
 * @param {any} session
 * @param {string} objectGroup
 * @returns {Promise<any>}
 */
export const startTrackingMutationObserverStackTraces = async (session, objectGroup) => {
  await StartTrackingConstructorStackTraces.startTrackingMutationObserverStackTraces(session, objectGroup, ConstructorKey.MutationObserver)
}
