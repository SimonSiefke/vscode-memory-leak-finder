import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'
import * as Arrays from '../Arrays/Arrays.js'

const compareNumber = (a, b) => {
  return b - a
}

const sortNumbers = (numbers) => {
  return Arrays.toSorted(numbers, compareNumber)
}

/**
 *
 * @param {any} session
 * @returns {Promise<number[]>}
 */
export const getNumbers = async (session, objectGroup) => {
  const prototype = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Array,
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
  for(const object of objects){
    for(const item of object){
      if(typeof item === 'number'){
        numbers.push(item)
      }
    }
  }
  return numbers
}`,
    objectId: objects.objects.objectId,
    returnByValue: true,
    objectGroup,
  })

  const sortedNumbers = sortNumbers(result)
  return sortedNumbers
}
