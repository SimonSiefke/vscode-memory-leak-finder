import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number[]>}
 */
export const getBooleanCount = async (session, objectGroup) => {
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

  const booleans = []

  const getValues = object => {
    try {
      return Object.values(object)
    } catch {
      return []
    }
  }

  const maxArrayLength = 100_000_000

  for(const object of objects){
    const values = getValues(object)
    for(const value of values){
      if(typeof value === 'boolean' && booleans.length < maxArrayLength){
        booleans.push(value)
      }
    }
  }
  return booleans.length
}`,
    objectId: objects.objects.objectId,
    returnByValue: true,
    objectGroup,
  })

  return result
}
