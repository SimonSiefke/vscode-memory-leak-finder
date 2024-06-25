import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.js'
import * as GetObjectIds from '../GetObjectIds/GetObjectIds.js'

const getObjectIds = (descriptors) => {}

export const getScopeCount = async (session, objectGroup) => {
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
  console.log({ objectIds })
  return 0
}
