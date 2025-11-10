import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

export const getPromisesWithStackTraces = async (session, objectGroup) => {
  const prototype = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Promise,
    returnByValue: false,
    objectGroup,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    prototypeObjectId: prototype.objectId,
    objectGroup,
  })
  console.log({ objects })
  const fnResult1 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: objects.objects.objectId,
    ownProperties: true,
    generatePreview: true,
    accessorPropertiesOnly: false,
    nonIndexedPropertiesOnly: false,
  })
  const descriptors = GetDescriptorValues.getDescriptorValues(fnResult1.result)
  console.log(descriptors)
  return descriptors
}
