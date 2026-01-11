import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

export const getDisposedDisposables = async (session: Session, objectGroup: string) => {
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Object,
    objectGroup,
    returnByValue: false,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    objectGroup,
    prototypeObjectId: prototypeDescriptor.objectId,
  })
  const fnResult1 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const objects = this

  const isDisposable = (object) => {
    return object && typeof object === 'object' && 'dispose' in object
  }

  const isDisposed = (object) => {
    return object && typeof object === 'object' && object._isDisposed
  }

  const isDisposedDisposable = object => {
    return isDisposable(object) && isDisposed(object)
  }

  const instances = objects.filter(isDisposedDisposable)
  return instances
}`,
    objectGroup,
    objectId: objects.objects.objectId,
    returnByValue: false,
  })
  return fnResult1
}
