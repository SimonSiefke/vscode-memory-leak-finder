import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.js'
import * as GetFunctionLocations from '../GetFunctionLocations/GetFunctionLocations.js'
import * as GetFunctionObjectIds from '../GetFunctionObjectIds/GetFunctionObjectIds.js'

export const getConstructorLocations = async (session, objectGroup, objects) => {
  const fnResult2 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const instances = this

  const map = new Map()

  for(const instance of instances){
    if(map.has(instance.constructor)){
      map.set(instance.constructor, map.get(instance.constructor) + 1)
    } else {
      map.set(instance.constructor, 1)
    }
  }

  const array = []

  for(const [instanceConstructor, count] of map.entries()){
    array.push(instanceConstructor)
  }

  return array
}`,
    objectId: objects.objectId,
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
