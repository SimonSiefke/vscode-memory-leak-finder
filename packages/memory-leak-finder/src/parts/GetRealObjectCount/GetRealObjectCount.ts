import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

export const getRealObjectCount = async (session: Session) => {
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Object,
    returnByValue: false,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    prototypeObjectId: prototypeDescriptor.objectId,
  })
  const fnResult1 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
const objects = this
const isRealObject = object => {
  if(!object){
    return false
  }
  if(Array.isArray(object)){
    return false
  }
  if(typeof object !== 'object'){
    return false
  }
  return true
}

const realObjects = objects.filter(isRealObject)
return realObjects.length
}`,
    objectId: objects.objects.objectId,
    returnByValue: true,
  })
  return fnResult1
}
