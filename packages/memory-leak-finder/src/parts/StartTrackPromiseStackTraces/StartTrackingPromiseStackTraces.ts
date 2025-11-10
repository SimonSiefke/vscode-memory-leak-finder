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

  static get [Symbol.species]() {
    return globalThis.___originalPromise
  }

  static [Symbol.hasInstance](instance) {
    return instance.constructor.name === 'Promise'
  }

  then(...args){
    const result = super.then(...args)
    const stackTrace = callsites()
    globalThis.___promiseStackTraces.set(result, stackTrace)
    return result
  }

  catch(...args){
    const result = super.catch(...args)
    const stackTrace = callsites()
    globalThis.___promiseStackTraces.set(result, stackTrace)
    return result
  }

  finally(...args){
    const result = super.finally(...args)
    const stackTrace = callsites()
    globalThis.___promiseStackTraces.set(result, stackTrace)
    return result
  }
}

globalThis.Promise.prototype.constructor = Promise

})()
undefined
`,
    objectGroup,
  })
}
