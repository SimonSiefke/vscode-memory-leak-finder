import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

export const getArrayElementCount = async (session) => {
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Array,
    includeCommandLineAPI: true,
    returnByValue: false,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    prototypeObjectId: prototypeDescriptor.objectId,
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
  })
  return fnResult1
}
