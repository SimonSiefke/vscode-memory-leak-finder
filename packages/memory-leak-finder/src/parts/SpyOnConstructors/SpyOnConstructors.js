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

  const spyOnPrototype = (object, originalPrototype) => {
    const newPrototype = function(...args){
      console.log('constructing', originalPrototype)
      return Reflect.construct(originalPrototype, args)
    }
    try {
      Object.setPrototypeOf(object, newPrototype)
    } catch (error){
      console.error(error)
    }
  }

  const spyOnPrototypes = (objects) => {
    const seen = []
    for(const object of objects){
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
