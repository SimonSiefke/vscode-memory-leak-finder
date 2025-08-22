import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

export const getAttachedDomNodeCount = async (session: Session, objectGroup: string): Promise<number> => {
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Node,
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
    objectId: objects.objects.objectId,
    returnByValue: true,
    objectGroup,
  })

  return fnResult1
}
