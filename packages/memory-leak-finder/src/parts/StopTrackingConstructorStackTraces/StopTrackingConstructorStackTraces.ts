import type { Dynamic } from '../Types/Types.ts'
import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
/**
 * @param {unknown} session
 * @param {string} objectGroup
 * @returns {Promise<unknown>}
 */
export const stopTrackingEventListenerStackTraces = async (session: Session, objectGroup: Dynamic, key: Dynamic) => {
  await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `(()=>{

const unmockGlobalConstructor = key => {
  const originalConstructor = globalThis['___original'+key]
  globalThis[key] = originalConstructor
  delete globalThis['___original'+key]
  delete globalThis['___map'+key]
}

unmockGlobalConstructor('${key}')

})()`,
    objectGroup,
  })
}
