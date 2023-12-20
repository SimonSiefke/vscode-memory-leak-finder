import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.js'
import * as GetDisposables from '../GetDisposables/GetDisposables.js'
import * as GetFunctionLocations from '../GetFunctionLocations/GetFunctionLocations.js'
import * as GetFunctionObjectIds from '../GetFunctionObjectIds/GetFunctionObjectIds.js'
import * as CleanFunctionLocations from '../CleanFunctionLocations/CleanFunctionLocations.js'

export const getDisposablesWithLocation = async (session, objectGroup) => {
  const disposables = await GetDisposables.getDisposables(session, objectGroup)
  const fnResult1 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const disposables = this

  const getConstructorOrFunctionLocation = disposable => {
    const constructorName = disposable.constructor.name
    if(constructorName === 'Object'){
      return disposable.dispose
    }
    return disposable.constructor
  }

  const locations = disposables.map(getConstructorOrFunctionLocation)
  return locations
}`,
    objectId: disposables.objectId,
    returnByValue: false,
    objectGroup,
  })
  const fnResult2 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: fnResult1.objectId,
    generatePreview: false,
    ownProperties: true,
  })
  const descriptors = GetDescriptorValues.getDescriptorValues(fnResult2.result)
  const functionObjectIds = GetFunctionObjectIds.getFunctionObjectIds(descriptors)
  const functionLocations = await GetFunctionLocations.getFunctionLocations(session, functionObjectIds)
  const cleanFunctionLocations = CleanFunctionLocations.cleanFunctionLocations(functionLocations)
  console.log({ cleanFunctionLocations })
  return cleanFunctionLocations
}
