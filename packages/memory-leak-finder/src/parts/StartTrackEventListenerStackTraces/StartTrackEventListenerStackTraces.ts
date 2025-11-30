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
}

const spyOnPropertyEventListeners = (object) => {
  const eventListenerKeys = Object.keys(object).filter(isEventListenerKey)
  for(const eventListenerKey of eventListenerKeys){
    spyOnPropertyEventListener(object, eventListenerKey)
  }
}

for(const object of [HTMLElement.prototype, Document.prototype, window]){
  spyOnPropertyEventListeners(object)

}
})()
undefined
`,
    objectGroup,
  })
}
