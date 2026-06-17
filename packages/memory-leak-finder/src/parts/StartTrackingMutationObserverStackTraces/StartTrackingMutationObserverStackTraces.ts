import type { Session } from '../Session/Session.ts'
import * as ConstructorKey from '../ConstructorKey/ConstructorKey.ts'
import * as StartTrackingConstructorStackTraces from '../StartTrackingConstructorStackTraces/StartTrackingConstructorStackTraces.ts'

/**
 * @param {unknown} session
 * @param {string} objectGroup
 * @returns {Promise<unknown>}
 */
export const startTrackingMutationObserverStackTraces = async (session: Session, objectGroup: string) => {
  await StartTrackingConstructorStackTraces.startTrackingMutationObserverStackTraces(session, objectGroup, ConstructorKey.MutationObserver)
}
