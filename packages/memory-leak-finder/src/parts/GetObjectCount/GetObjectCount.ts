import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as GetRemoteObjectLength from '../GetRemoteObjectLength/GetRemoteObjectLength.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'

export const getObjectCount = async (session: Session, prototype: string): Promise<number> => {
  const objectGroup = ObjectGroupId.create()
  try {
    const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
      expression: prototype,
      objectGroup,
      returnByValue: false,
    })
    const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
      objectGroup,
      prototypeObjectId: prototypeDescriptor.objectId,
    })
    return await GetRemoteObjectLength.getRemoteObjectLength(session, objects.objects.objectId, objectGroup)
  } finally {
    await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
  }
}
