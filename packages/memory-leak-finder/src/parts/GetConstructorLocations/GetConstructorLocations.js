import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.js'
import * as GetFunctionLocations from '../GetFunctionLocations/GetFunctionLocations.js'
import * as GetFunctionObjectIds from '../GetFunctionObjectIds/GetFunctionObjectIds.js'

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
  console.time('properties')
  const fnResult3 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: fnResult2.objectId,
    generatePreview: false,
    ownProperties: true,
  })
  console.timeEnd('properties')
  const descriptors = GetDescriptorValues.getDescriptorValues(fnResult3.result)
  const functionObjectIds = GetFunctionObjectIds.getFunctionObjectIds(descriptors)
  console.time('locations')
  const functionLocations = await GetFunctionLocations.getFunctionLocations(session, functionObjectIds)
  console.timeEnd('locations')
  return functionLocations
}
