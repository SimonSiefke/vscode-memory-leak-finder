import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.ts'
import * as GetFunctionLocations from '../GetFunctionLocations/GetFunctionLocations.ts'
import * as GetFunctionObjectIds from '../GetFunctionObjectIds/GetFunctionObjectIds.ts'

export const getConstructorLocations = async (session, objectGroup, map) => {
  const fnResult2 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const map = this
  const array = []

  for(const [instanceConstructor, count] of map.entries()){
    array.push(instanceConstructor)
  }

  return array
}`,
    objectId: map.objectId,
    returnByValue: false,
    objectGroup,
  })
  const fnResult3 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: fnResult2.objectId,
    generatePreview: false,
    ownProperties: true,
  })
  const descriptors = GetDescriptorValues.getDescriptorValues(fnResult3.result)
  const functionObjectIds = GetFunctionObjectIds.getFunctionObjectIds(descriptors)
  const functionLocations = await GetFunctionLocations.getFunctionLocations(session, functionObjectIds)
  return functionLocations
}
