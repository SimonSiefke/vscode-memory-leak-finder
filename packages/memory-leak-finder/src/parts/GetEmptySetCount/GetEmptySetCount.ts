import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'

export const getEmptySetCount = async (session: Session): Promise<number> => {
  const objectGroup = ObjectGroupId.create()
  try {
    const prototype = await DevtoolsProtocolRuntime.evaluate(session, {
      expression: PrototypeExpression.Set,
      objectGroup,
      returnByValue: false,
    })
    const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
      objectGroup,
      prototypeObjectId: prototype.objectId,
    })
    return await DevtoolsProtocolRuntime.callFunctionOn(session, {
      functionDeclaration: `function() {
  const getSize = Object.getOwnPropertyDescriptor(Set.prototype, 'size').get
  let count = 0
  for (const object of this) {
    try {
      if (Reflect.apply(getSize, object, []) === 0) {
        count++
      }
    } catch {
      // A subclass prototype can inherit Set.prototype without having Set internal slots.
    }
  }
  return count
}`,
      objectGroup,
      objectId: objects.objects.objectId,
      returnByValue: true,
    })
  } finally {
    await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
  }
}
