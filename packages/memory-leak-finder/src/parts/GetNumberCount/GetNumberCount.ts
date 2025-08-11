import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getNumberCount = async (session, objectGroup) => {
  const prototype = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Object,
    returnByValue: false,
    objectGroup,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    prototypeObjectId: prototype.objectId,
    objectGroup,
  })
  const result = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function () {
  const objects = this

  const numbers = []

  const getValues = object => {
    try {
      return Object.values(object)
    } catch {
      return []
    }
  }

  let numberCount = 0

  for(const object of objects){
    const values = getValues(object)
    for(const value of values){
      if(typeof value === 'number'){
        numberCount++
      }
    }
  }
  return numberCount
}`,
    objectId: objects.objects.objectId,
    returnByValue: true,
    objectGroup,
  })
  return result
}
