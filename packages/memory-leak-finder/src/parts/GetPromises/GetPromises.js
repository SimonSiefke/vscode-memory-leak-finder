import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetDescriptors from '../GetDescriptorValues/GetDescriptorValues.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

export const getPromises = async (session, objectGroup) => {
  // TODO get promises array with [[PromiseState]] and [[PromiseResult]]
  const prototype = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Promise,
    includeCommandLineAPI: true,
    returnByValue: false,
    objectGroup,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    prototypeObjectId: prototype.objectId,
    objectGroup,
  })
  const fnResult1 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: objects.objects.objectId,
    ownProperties: true,
    generatePreview: true,
    accessorPropertiesOnly: false,
    nonIndexedPropertiesOnly: false,
  })
  const descriptors = GetDescriptors.getDescriptorValues(fnResult1)
  console.log({ descriptors })
  return descriptors
}
