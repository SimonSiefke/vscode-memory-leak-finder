import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as SplitLines from '../SplitLines/SplitLines.js'

const getPrettyStackTrace = (value) => {
  return {
    ...value,
    stackTrace: SplitLines.splitLines(value.stackTrace),
  }
}

export const getConstructorStackTraces = async (session, objectGroup, key) => {
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `___original${key}.prototype`,
    returnByValue: false,
    objectGroup,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    prototypeObjectId: prototypeDescriptor.objectId,
    objectGroup,
  })
  const stackTraces = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const objects = this
  const getStackTraces = (objects, key) => {
    const map = globalThis['___map'+key]
    const stackTraces = []
    for(const object of objects){
      const value = map.get(object)
      if(value){
        stackTraces.push(value)
      }
    }
    return stackTraces
  }
  return getStackTraces(objects, '${key}')
}`,
    returnByValue: true,
    objectId: objects.objects.objectId,
    objectGroup,
  })
  const betterStackTraces = stackTraces.map(getPrettyStackTrace)
  return betterStackTraces
}
