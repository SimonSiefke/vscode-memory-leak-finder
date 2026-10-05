import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

/**
 * @param {unknown} session
 * @param {string} objectGroup
 * @returns {Promise<unknown>}
 */
export const startTrackingPromiseStackTraces = async (session: Session, objectGroup: string) => {
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

  static all(...args){
    const result = super.all(...args)
    const stackTrace = callsites()
    globalThis.___promiseStackTraces.set(result, stackTrace)
    return result
  }

  static allSettled(...args){
    const result = super.allSettled(...args)
    const stackTrace = callsites()
    globalThis.___promiseStackTraces.set(result, stackTrace)
    return result
  }

  static unknown(...args){
    const result = super.unknown(...args)
    const stackTrace = callsites()
    globalThis.___promiseStackTraces.set(result, stackTrace)
    return result
  }

  static race(...args){
    const result = super.race(...args)
    const stackTrace = callsites()
    globalThis.___promiseStackTraces.set(result, stackTrace)
    return result
  }

  static reject(...args){
    const result = super.reject(...args)
    const stackTrace = callsites()
    globalThis.___promiseStackTraces.set(result, stackTrace)
    return result
  }

  static resolve(...args){
    const result = super.resolve(...args)
    const stackTrace = callsites()
    globalThis.___promiseStackTraces.set(result, stackTrace)
    return result
  }

  static try(...args){
    const result = super.try(...args)
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
