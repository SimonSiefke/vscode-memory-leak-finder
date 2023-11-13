import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

/**
 * @param {any} session
 * @param {string} objectGroup
 * @returns {Promise<any>}
 */
export const startTrackingMutationObserverStackTraces = async (session, objectGroup) => {
  await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `(()=>{
globalThis.___mutationObserverStackTraces = []


// based on https://github.com/sindresorhus/callsites
const callsites = () => {
	const _prepareStackTrace = Error.prepareStackTrace;
	Error.prepareStackTrace = (_, stack) => stack;
	const stack = new Error().stack.slice(2);
	Error.prepareStackTrace = _prepareStackTrace;
	return stack.join('\\n')
}


const mockGlobalConstructor = key => {
  const originalConstructor = globalThis[key]
  globalThis['___original'+key] = originalConstructor
  globalThis[key] = function (...args){
    console.trace('constructed'+key)
    return Reflect.construct(originalConstructor, args)
  }
}

mockGlobalConstructor('MutationObserver')

})()
undefined
`,
    objectGroup,
  })
}
