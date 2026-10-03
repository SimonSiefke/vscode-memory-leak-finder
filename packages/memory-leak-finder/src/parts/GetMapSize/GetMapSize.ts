import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'

export const getMapSize = async (session: Session) => {
  const objectGroup = ObjectGroupId.create()
  try {
    const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
      expression: PrototypeExpression.Map,
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
  let total = 0
  for(const object of objects){
    total += object.size
  }
  return total
}`,
      objectId: objects.objects.objectId,
      returnByValue: true,
    })
    return fnResult1
  } finally {
    await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
  }
}
