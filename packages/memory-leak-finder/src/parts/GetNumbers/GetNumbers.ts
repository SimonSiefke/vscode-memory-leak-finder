import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'
import * as Arrays from '../Arrays/Arrays.ts'

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

  const maxArrayLength = 100_000_000

  for(const object of objects){
    const values = getValues(object)
    for(const value of values){
      if(typeof value === 'number' && numbers.length < maxArrayLength){
        numbers.push(value)
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
