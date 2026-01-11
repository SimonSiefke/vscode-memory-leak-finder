import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { filterNamedFunctions } from '../FilterNamedFunctions/FilterNamedFunctions.ts'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.ts'
import * as GetFunctionObjectIds from '../GetFunctionObjectIds/GetFunctionObjectIds.ts'
import * as GetNamedFunctionLocations from '../GetNamedFunctionLocations/GetNamedFunctionLocations.ts'
import * as PrototypeExpression from '../PrototypeExpression/PrototypeExpression.ts'

export const getNamedFunctionCount = async (
  session: Session,
  objectGroup: string,
  scriptMap: any,
  includeSourceMap: boolean,
): Promise<readonly any[]> => {
  const prototypeDescriptor = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: PrototypeExpression.Function,
    objectGroup,
    returnByValue: false,
  })
  const objects = await DevtoolsProtocolRuntime.queryObjects(session, {
    objectGroup,
    prototypeObjectId: prototypeDescriptor.objectId,
  })
  const fnResult2 = await filterNamedFunctions(session, objects, objectGroup)
  const fnResult3 = await DevtoolsProtocolRuntime.getProperties(session, {
    generatePreview: false,
    objectId: fnResult2.objectId,
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
