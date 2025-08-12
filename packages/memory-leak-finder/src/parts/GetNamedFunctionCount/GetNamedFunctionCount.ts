import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { filterNamedFunctions } from '../FilterNamedFunctions/FilterNamedFunctions.ts'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.ts'
import * as GetFunctionObjectIds from '../GetFunctionObjectIds/GetFunctionObjectIds.ts'
import * as GetNamedFunctionLocations from '../GetNamedFunctionLocations/GetNamedFunctionLocations.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

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
  const fnResult2 = await filterNamedFunctions(session, objects, objectGroup)
  const fnResult3 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: fnResult2.objectId,
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
