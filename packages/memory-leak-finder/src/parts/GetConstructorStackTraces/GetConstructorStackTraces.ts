import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as SplitLines from '../SplitLines/SplitLines.ts'

export const getConstructorStackTraces = async (session: Session, objectGroup: string, key: string) => {
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `___original${key}.prototype`,
    objectGroup,
    returnByValue: false,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    objectGroup,
    prototypeObjectId: prototypeDescriptor.objectId,
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
    objectGroup,
    objectId: objects.objects.objectId,
    returnByValue: true,
  })
  const betterStackTraces = stackTraces.map(SplitLines.splitLines)
  return betterStackTraces
}
