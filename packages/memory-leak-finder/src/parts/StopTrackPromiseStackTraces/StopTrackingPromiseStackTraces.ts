import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

/**
 * @param {unknown} session
 * @param {string} objectGroup
 * @returns {Promise<unknown>}
 */
export const stopTrackingPromiseStackTraces = async (session: Session, objectGroup: string) => {
  await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `(()=>{
delete globalThis.___promiseStackTraces
if (!globalThis.___originalPromise) {
  return
}
globalThis.Promise = globalThis.___originalPromise
delete globalThis.___originalPromise

})()`,
    objectGroup,
  })
}
