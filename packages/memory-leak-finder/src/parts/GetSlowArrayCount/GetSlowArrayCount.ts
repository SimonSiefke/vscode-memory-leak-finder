import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getSlowArrayCount = async (session, objectGroup) => {
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Array,
    returnByValue: false,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    prototypeObjectId: prototypeDescriptor.objectId,
    objectGroup,
  })
  await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const arrays = this
  let total = 0
  for(const array of arrays){
    const hasFastElements = %HasFastPackedElements(array)
    if(!hasFastElements){
      total++
    }
  }
  return total
}`,
    objectId: objects.objects.objectId,
    returnByValue: true,
    objectGroup,
  })
  return 0
}
