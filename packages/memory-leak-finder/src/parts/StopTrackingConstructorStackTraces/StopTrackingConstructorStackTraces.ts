import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

/**
 * @param {any} session
 * @param {string} objectGroup
 * @returns {Promise<any>}
 */
export const stopTrackingEventListenerStackTraces = async (session, objectGroup, key) => {
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
