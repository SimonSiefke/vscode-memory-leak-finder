import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

export const getStoredPromiseCount = async (session: Session, objectGroup: string) => {
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Object,
    objectGroup,
    returnByValue: false,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    objectGroup,
    prototypeObjectId: prototypeDescriptor.objectId,
  })
  const fnResult1 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const objects = this

  const getValues = object => {
    try {
      return Object.values(object)
    } catch {
      return []
    }
  }

  const isPromise = value => {
    return value instanceof Promise
  }

  const getStoredPromises = (object) => {
    const values = getValues(object)
    const promises = values.filter(isPromise)
    return promises
  }

  const storedPromises = objects.flatMap(getStoredPromises)
  const total = storedPromises.length
  return total
}`,
    objectGroup,
    objectId: objects.objects.objectId,
    returnByValue: true,
  })
  return fnResult1
}
