import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.js'
import * as GetFunctionObjectIds from '../GetFunctionObjectIds/GetFunctionObjectIds.js'
import * as GetNamedFunctionLocations from '../GetNamedFunctionLocations/GetNamedFunctionLocations.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

/**
 * @param {any} session
 * @returns {Promise<any[]>}
 */
export const getNamedFunctionCount = async (session, objectGroup, scriptMap, includeSourceMap) => {
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Function,
    returnByValue: false,
    objectGroup,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    prototypeObjectId: prototypeDescriptor.objectId,
    objectGroup,
  })
  const fnResult3 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: objects.objects.objectId,
    generatePreview: false,
    ownProperties: true,
  })
  const descriptors = GetDescriptorValues.getDescriptorValues(fnResult3.result)
  const functionObjectIds = GetFunctionObjectIds.getFunctionObjectIds(descriptors)
  const functionLocations = await GetNamedFunctionLocations.getNamedFunctionLocations(
    session,
    functionObjectIds,
    scriptMap,
    includeSourceMap,
  )
  return functionLocations
}
