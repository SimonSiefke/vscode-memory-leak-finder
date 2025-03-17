import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

export const getStoredPromiseCount = async (session, objectGroup) => {
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Object,
    returnByValue: false,
    objectGroup,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    prototypeObjectId: prototypeDescriptor.objectId,
    objectGroup,
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
    objectId: objects.objects.objectId,
    returnByValue: true,
    objectGroup,
  })
  return fnResult1
}
