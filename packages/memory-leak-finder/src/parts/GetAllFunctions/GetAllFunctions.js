import * as Assert from '../Assert/Assert.js'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.js'
import * as GetObjectIds from '../GetObjectIds/GetObjectIds.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

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
  console.log({ objects })
  const fnResult1 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: objects.objects.objectId,
    ownProperties: true,
    generatePreview: false,
  })
  const descriptors = GetDescriptorValues.getDescriptorValues(fnResult1.result)
  const objectIds = GetObjectIds.getObjectIds(descriptors)
  return objectIds
}
