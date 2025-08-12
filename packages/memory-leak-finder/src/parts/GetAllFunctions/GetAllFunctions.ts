import * as Assert from '../Assert/Assert.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.ts'
import * as GetObjectIds from '../GetObjectIds/GetObjectIds.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

export const getAllFunctions = async (session, objectGroup) => {
  Assert.object(session)
  Assert.string(objectGroup)
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Function,
    returnByValue: false,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    prototypeObjectId: prototypeDescriptor.objectId,
    objectGroup,
  })
  const fnResult1 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: objects.objects.objectId,
    ownProperties: true,
    generatePreview: false,
  })
  const descriptors = GetDescriptorValues.getDescriptorValues(fnResult1.result)
  const objectIds = GetObjectIds.getObjectIds(descriptors)
  return objectIds
}
