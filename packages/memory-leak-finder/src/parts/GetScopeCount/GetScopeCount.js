import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetAllScopeProperties from '../GetAllScopeProperties/GetAllScopeProperties.js'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.js'
import * as GetObjectIds from '../GetObjectIds/GetObjectIds.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

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
  const scopeProperties = await GetAllScopeProperties.getAllScopeProperties(session, objectGroup, objectIds)
  return scopeProperties.length
}
