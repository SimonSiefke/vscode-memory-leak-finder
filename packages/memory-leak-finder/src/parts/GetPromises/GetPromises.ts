import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'
import type { Session } from '../Session/Session.ts'

export const getPromises = async (session: Session, objectGroup: string) => {
  const prototype = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Promise,
    objectGroup,
    returnByValue: false,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    objectGroup,
    prototypeObjectId: prototype.objectId,
  })
  const fnResult1 = await DevtoolsProtocolRuntime.getProperties(session, {
    accessorPropertiesOnly: false,
    generatePreview: true,
    nonIndexedPropertiesOnly: false,
    objectId: objects.objects.objectId,
    ownProperties: true,
  })
  const descriptors = GetDescriptorValues.getDescriptorValues(fnResult1.result)
  return descriptors
}
