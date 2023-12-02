import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

/**
 * @param {any} session
 * @param {string} objectGroup
 * @returns {Promise<any>}
 */
export const stopTrackingDomNodeStackTraces = async (session, objectGroup) => {
  await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `(()=>{
document.createElement = globalThis.___originalCreateElement

delete globalThis.___originalCreateElement
delete globalThis.___domNodeStackTraces

})()
undefined
`,
    objectGroup,
  })
}
