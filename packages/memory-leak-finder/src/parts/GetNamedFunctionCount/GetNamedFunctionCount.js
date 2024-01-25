import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.js'
import * as GetFunctionObjectIds from '../GetFunctionObjectIds/GetFunctionObjectIds.js'
import * as GetNamedFunctionLocations from '../GetNamedFunctionLocations/GetNamedFunctionLocations.js'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.js'

/**
 * @param {any} session
 * @returns {Promise<any[]>}
 */
export const getNamedFunctionCount = async (session, objectGroup, scriptMap) => {
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Function,
    returnByValue: false,
    objectGroup,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    prototypeObjectId: prototypeDescriptor.objectId,
    objectGroup,
  })
  const fnResult1 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const functions = this
  return functions
}`,
    objectId: objects.objects.objectId,
    returnByValue: false,
    objectGroup,
  })
  const fnResult3 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: fnResult1.objectId,
    generatePreview: false,
    ownProperties: true,
  })
  const descriptors = GetDescriptorValues.getDescriptorValues(fnResult3.result)
  const functionObjectIds = GetFunctionObjectIds.getFunctionObjectIds(descriptors)
  const functionLocations = await GetNamedFunctionLocations.getNamedFunctionLocations(session, functionObjectIds, scriptMap)
  return functionLocations
}
