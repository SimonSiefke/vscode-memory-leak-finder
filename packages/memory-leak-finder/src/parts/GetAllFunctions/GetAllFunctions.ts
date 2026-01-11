import type { Session } from '../Session/Session.ts'
import * as Assert from '../Assert/Assert.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.ts'
import * as GetObjectIds from '../GetObjectIds/GetObjectIds.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

export const getAllFunctions = async (session: Session, objectGroup: string) => {
  Assert.object(session)
  Assert.string(objectGroup)
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Function,
    returnByValue: false,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    objectGroup,
    prototypeObjectId: prototypeDescriptor.objectId,
  })
  const fnResult1 = await DevtoolsProtocolRuntime.getProperties(session, {
    generatePreview: false,
    objectId: objects.objects.objectId,
    ownProperties: true,
  })
  const descriptors = GetDescriptorValues.getDescriptorValues(fnResult1.result)
  const objectIds = GetObjectIds.getObjectIds(descriptors)
  return objectIds
}
