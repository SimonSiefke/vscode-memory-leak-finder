import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number[]>}
 */
export const getSymbols = async (session, objectGroup) => {
  // TODO get symbols and groups them by name
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

  const symbols = []

  const getValues = object => {
    try {
      return Object.values(object)
    } catch {
      return []
    }
  }

  const getSymbols = object => {
    try {
      const allSymbols = []
      for(const value of Object.values(object)){

      }
      return allSymbols
    } catch {
      return []
    }
  }

  const maxArrayLength = 100_000_000

  for(const object of objects){
    const ownSymbols = Object.getOwnPropertySymbols(object)
    symbols.push(...ownSymbols)
    const values = getValues(object)
    for(const value of values){
      if(typeof value === 'symbol'){
        symbols.push(value)
      }
    }
  }
  return symbols.length
}`,
    objectId: objects.objects.objectId,
    returnByValue: true,
    objectGroup,
  })

  return result
}
