import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getTypedArrayCount = async (session, objectGroup) => {
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

  const typedArrayConstructors = new Set([
    Uint8ClampedArray,
    Float32Array,
    Float64Array,
    Int16Array,
    Int32Array,
    Int8Array,
    Uint16Array,
    Uint32Array,
    Uint8Array,
    BigInt64Array,
    BigUint64Array,
  ])

  const isTypedArray = value => {
    try {
      return typedArrayConstructors.has(value.constructor)
    } catch {
      return false
    }
  }

  let total = 0

  for(const object of objects){
    const values = getValues(object)
    const typed = values.filter(isTypedArray)
    total += typed.length
  }

  return total
}`,
    objectId: objects.objects.objectId,
    returnByValue: true,
    objectGroup,
  })
  return fnResult1
}
