import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getTypedArrayCount = async (session, objectGroup) => {
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Array,
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
  let total = 0
  for(const object of objects){
    total += object.length
  }
  return total
}`,
    objectId: objects.objects.objectId,
    returnByValue: true,
    objectGroup,
  })
  return 0
}
