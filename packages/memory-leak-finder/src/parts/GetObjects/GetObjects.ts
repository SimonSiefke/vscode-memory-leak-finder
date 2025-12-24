import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'
import type { Session } from '../Session/Session.ts'

export const getObjects = async (session: Session, objectGroup?: string) => {
  const prototype = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Object,
    objectGroup,
    returnByValue: false,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    objectGroup,
    prototypeObjectId: prototype.objectId,
  })

  const fnResult1 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function () {
  const objects = this

  const getValues = object => {
    try {
      return Object.values(object)
    } catch {
      return []
    }
  }

  const getAllValues = objects => {
    const seen = new Set([objects])
    for(const object of objects){
      const values = getValues(object)
      for(const value of values){
        if(!seen.has(value)){
          seen.add(value)
        }
      }
    }
    return [...seen]
  }

  const values = getAllValues(objects)
  return values
}`,
    objectGroup,
    objectId: objects.objects.objectId,
    returnByValue: false,
  })
  return fnResult1
}
