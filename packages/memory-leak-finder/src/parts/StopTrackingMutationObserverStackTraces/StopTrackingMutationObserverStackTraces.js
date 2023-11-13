import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

/**
 * @param {any} session
 * @param {string} objectGroup
 * @returns {Promise<any>}
 */
export const stopTrackingMutationObserverStackTraces = async (session, objectGroup) => {
  await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `(()=>{
delete globalThis.___mutationObserverStackTraces

const unmockGlobalConstructor = key => {
  const originalConstructor = globalThis['___original'+key]
  globalThis[key] = originalConstructor
}

unmockGlobalConstructor('MutationObserver')

})()
undefined
`,
    objectGroup,
  })
}
