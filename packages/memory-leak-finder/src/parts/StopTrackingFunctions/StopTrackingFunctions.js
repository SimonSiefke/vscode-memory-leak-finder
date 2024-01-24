import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

export const stopTrackingFunctions = async (session, objectGroup) => {
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
  const functions = this

  const leaked = []
  for(const value of functions){
    if(!value.___existsBefore){
      leaked.push(value)
    }
  }
  return leaked
}`,
    objectId: objects.objects.objectId,
    returnByValue: false,
    objectGroup,
  })
  return fnResult1
}
