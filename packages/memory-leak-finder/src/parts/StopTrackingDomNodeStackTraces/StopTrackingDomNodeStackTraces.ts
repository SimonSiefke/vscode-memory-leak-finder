import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

/**
 * @param {any} session
 * @param {string} objectGroup
 * @returns {Promise<any>}
 */
export const stopTrackingDomNodeStackTraces = async (session: Session, objectGroup: string) => {
  await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `(()=>{
document.createElement = globalThis.___originalCreateElement

delete globalThis.___originalCreateElement

})()
undefined
`,
    objectGroup,
  })
}
