import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

/**
 * @param {any} session
 * @param {string} objectGroup
 * @returns {Promise<any>}
 */
export const startTrackingPromiseStackTraces = async (session, objectGroup) => {
  await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `(()=>{
globalThis.___promiseStackTraces = new WeakMap()
globalThis.___originalPromise = globalThis.Promise


// based on https://github.com/sindresorhus/callsites
const callsites = () => {
	const _prepareStackTrace = Error.prepareStackTrace;
	Error.prepareStackTrace = (_, stack) => stack;
	const stack = new Error().stack.slice(2);
	Error.prepareStackTrace = _prepareStackTrace;
	return stack.join('\\n')
}

globalThis.Promise = class extends globalThis.___originalPromise {
  constructor(...args){
    super(...args)
    const stackTrace = callsites()
    globalThis.___promiseStackTraces.set(this, stackTrace)
  }

  then(...args){
    const result = super(...args)
    const stackTrace = callsites()
    globalThis.___promiseStackTraces.set(result, stackTrace)
    return result
  }

  catch(...args){
    const result = super(...args)
    const stackTrace = callsites()
    globalThis.___promiseStackTraces.set(result, stackTrace)
    return result
  }
}

})()
undefined
`,
    objectGroup,
  })
}
