import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'

export const spyOnContructors = async (session, objectGroup, constructorsObjectId) => {
  // TODO
  // 1. for each class, modify constructor to point to custom class
  //    that captures stack trace on creation
  //    and calls the original prototype constructor
  await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const constructors = this

  const getConstructor = instance => {
    return instance.prototype
  }

  const unique = (array) => {
    const result = []
    for(const element of array){
      if(!result.includes(element)){
        result.push(element)
      }
    }
    return result
  }



  // based on https://github.com/sindresorhus/callsites
  const callsites = () => {
    const _prepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = (_, stack) => stack;
    const stack = new Error().stack.slice(2);
    Error.prepareStackTrace = _prepareStackTrace;
    return stack.join('\\n')
  }


  // based on https://gist.github.com/nolanlawson/0e18b8d7b5f6eb11554b5aa1fc4b5a4a
  const originalAddEventListener = Node.prototype.addEventListener
  Node.prototype.addEventListener = function (...args){
    const stackTrace = callsites()
    globalThis.___eventListenerStackTraces.push({args, stackTrace})
    return originalAddEventListener.apply(this, args)
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

  const spyOnPrototype = (object, originalPrototype) => {
    const newPrototype = function(...args){
      console.log('constructing', originalPrototype)
      return Reflect.construct(originalPrototype, args)
    }
  }

  const spyOnPrototypes = (objects) => {
    const seen = []
    for(const object of constructors){
      const originalPrototype = object.prototype
      if(seen.includes(originalPrototype)){
        continue
      }
      seen.push(originalPrototype)
      spyOnPrototype(object, originalPrototype)
    }
  }

  globalThis.___instanceStackTraces = []

  spyOnPrototypes(constructors)
}
`,
    objectGroup,
    objectId: constructorsObjectId,
  })
}
