import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

/**
 * @param {any} session
 * @param {string} objectGroup
 * @returns {Promise<any>}
 */
export const startTrackingDomNodeStackTraces = async (session, objectGroup) => {
  await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `(()=>{
globalThis.___domNodeStackTraces = []

// based on https://github.com/sindresorhus/callsites
const callsites = () => {
	const _prepareStackTrace = Error.prepareStackTrace;
	Error.prepareStackTrace = (_, stack) => stack;
	const stack = new Error().stack.slice(2);
	Error.prepareStackTrace = _prepareStackTrace;
	return stack.join('\\n')
}

const originalCreateElement = document.createElement.bind(document)
globalThis.___originalCreateElement = originalCreateElement

document.createElement = function (...args){
  const stackTrace = callsites()
  globalThis.___domNodeStackTraces.push({args, stackTrace})
  return originalCreateElement.apply(this, args)
}
})()
undefined
`,
    objectGroup,
  })
}
