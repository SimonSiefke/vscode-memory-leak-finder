import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

/**
 * @param {any} session
 * @param {string} objectGroup
 * @returns {Promise<any>}
 */
export const startTrackingEventListenerStackTraces = async (session, objectGroup) => {
  await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `(()=>{
globalThis.___eventListenerStackTraces = []
globalThis.___eventListenerDisposables = []

// based on https://github.com/sindresorhus/callsites
const callsites = () => {
	const _prepareStackTrace = Error.prepareStackTrace;
	Error.prepareStackTrace = (_, stack) => stack;
	const stack = new Error().stack.slice(2);
	Error.prepareStackTrace = _prepareStackTrace;
	return stack.join('\\n')
}

const isEventListenerKey = key => {
  return key.startsWith('on')
}

// based on https://github.com/facebook/jest/pull/5107/files
const spyOnPropertyEventListener = (object, eventListenerKey) => {
  const descriptor = Object.getOwnPropertyDescriptor(object, eventListenerKey)
  if(!descriptor.configurable){
    return
  }
  Object.defineProperty(object, eventListenerKey, {
    set(newValue){
      const stackTrace = callsites()
      globalThis.___eventListenerStackTraces.push({args: [eventListenerKey, newValue], stackTrace})
      descriptor.set.call(this, newValue)
    },
    get(){
      return descriptor.get.call(this)
    },
    configurable: true,
    writeable: true,
    enumerable: true
  })
  globalThis.___eventListenerDisposables.push(() => {
    Object.defineProperty(object, eventListenerKey, descriptor)
  })
}

const spyOnPropertyEventListeners = (object) => {
  const eventListenerKeys = Object.keys(object).filter(isEventListenerKey)
  for(const eventListenerKey of eventListenerKeys){
    spyOnPropertyEventListener(object, eventListenerKey)
  }
}

const spyOnEventTarget = (object) => {
  // based on https://gist.github.com/nolanlawson/0e18b8d7b5f6eb11554b5aa1fc4b5a4a
  const originalAddEventListener = object.prototype.addEventListener
  object.prototype.addEventListener = function (...args){
    const stackTrace = callsites()
    globalThis.___eventListenerStackTraces.push({args, stackTrace})
    return originalAddEventListener.apply(this, args)
  }
  globalThis.___eventListenerDisposables.push(() => {
    object.prototype.addEventListener = originalAddEventListener
  })
}

const prototypes = [HTMLElement.prototype, Document.prototype, window]
const primitives = [EventTarget]

for(const object of prototypes){
  spyOnPropertyEventListeners(object)
}

for(const object of primitives){
  spyOnEventTarget(object)
}

})()
undefined
`,
    objectGroup,
  })
}
