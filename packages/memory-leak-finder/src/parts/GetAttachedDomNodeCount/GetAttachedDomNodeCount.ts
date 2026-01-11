import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

export const getAttachedDomNodeCount = async (session: Session, objectGroup: string): Promise<number> => {
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Node,
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

  const isConnected = node => {
    try {
      return node.isConnected
    } catch {
      return false
    }
  }

  const attached = objects.filter(isConnected)
  const attachedCount = attached.length
  return attachedCount
}`,
    objectGroup,
    objectId: objects.objects.objectId,
    returnByValue: true,
  })

  return fnResult1
}
