import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

/**
 * @param {any} session
 * @param {string} objectGroup
 * @returns {Promise<any>}
 */
export const stopTrackingEventListenerStackTraces = async (session, objectGroup) => {
  await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `(()=>{

const fns = globalThis.___eventListenerDisposables
for(const fn of fns){
  fn()
}

delete globalThis.___eventListenerDisposables
delete globalThis.___eventListenerStackTraces

undefined
`,
    objectGroup,
  })
}
