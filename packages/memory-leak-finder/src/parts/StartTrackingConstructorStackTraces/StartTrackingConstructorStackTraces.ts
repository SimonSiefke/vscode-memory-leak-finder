import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

/**
 * @param {any} session
 * @param {string} objectGroup
 * @returns {Promise<any>}
 */
export const startTrackingMutationObserverStackTraces = async (session, objectGroup, key) => {
  await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `(()=>{


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
  const map = new WeakMap()
  globalThis['___original'+key] = originalConstructor
  globalThis['___map'+key] = map
  globalThis[key] = function (...args){
    const stackTrace = callsites()
    const instance = Reflect.construct(originalConstructor, args)
    map.set(instance, stackTrace)
    return instance
  }
}

mockGlobalConstructor('${key}')

})()
undefined
`,

    objectGroup,
  })
}
