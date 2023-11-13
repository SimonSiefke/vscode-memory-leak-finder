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
  globalThis['___stackTraces'+key] = []
  globalThis['___original'+key] = originalConstructor
  globalThis[key] = function (...args){
    const stackTrace = callsites()
    globalThis['___stackTraces'+key].push({stackTrace})
    return Reflect.construct(originalConstructor, args)
  }
}

mockGlobalConstructor('${key}')

})()
undefined
`,

    objectGroup,
  })
}
