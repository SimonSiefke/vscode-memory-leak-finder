import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'
import type { Session } from '../Session/Session.ts'

/**
 *
 * @param {any} session
 * @returns {Promise<number>}
 */
export const getSlowArrayCount = async (session: Session, objectGroup: string) => {
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Array,
    returnByValue: false,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    objectGroup,
    prototypeObjectId: prototypeDescriptor.objectId,
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
    objectGroup,
    objectId: objects.objects.objectId,
    returnByValue: true,
  })
  return 0
}
