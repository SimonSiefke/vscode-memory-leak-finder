import * as CleanFunctionLocations from '../CleanFunctionLocations/CleanFunctionLocations.js'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetDescriptorValues from '../GetDescriptorValues/GetDescriptorValues.js'
import * as GetDisposables from '../GetDisposables/GetDisposables.js'
import * as GetFunctionLocations from '../GetFunctionLocations/GetFunctionLocations.js'
import * as GetFunctionObjectIds from '../GetFunctionObjectIds/GetFunctionObjectIds.js'

export const getDisposablesWithLocation = async (session, objectGroup, scriptMap) => {
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
  const fnResult2 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const locations = this

  const unique = (values) => {
    const seen = []
    for (const value of values) {
      if (!seen.includes(value)) {
        seen.push(value)
      }
    }
    return seen
  }

  const uniqueLocations = unique(locations)
  return uniqueLocations
}`,
    objectId: fnResult1.objectId,
    returnByValue: false,
    objectGroup,
  })
  const fnResult5 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const uniqueLocations = this

  const getName = value => {
    return value.name
  }

  const getNames = values => {
    return values.map(getName)
  }

  const names = getNames(uniqueLocations)
  return names
}`,
    objectId: fnResult2.objectId,
    returnByValue: true,
    objectGroup,
  })
  const fnResult3 = await DevtoolsProtocolRuntime.callFunctionOn(session, {
    functionDeclaration: `function(){
  const locations = this

  const getCounts = values => {
    const seen = []
    const counts = []
    for (const value of values) {
      const index = seen.indexOf(value)
      if(index === -1){
        seen.push(value)
        counts.push(1)
      } else {
        counts[index]++
      }
    }
    return counts
  }
  const counts = getCounts(locations)
  return counts
}`,
    objectId: fnResult1.objectId,
    returnByValue: true,
    objectGroup,
  })
  const fnResult4 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId: fnResult2.objectId,
    generatePreview: false,
    ownProperties: true,
  })
  const descriptors = GetDescriptorValues.getDescriptorValues(fnResult4.result)
  const functionObjectIds = GetFunctionObjectIds.getFunctionObjectIds(descriptors)
  const functionLocations = await GetFunctionLocations.getFunctionLocations(session, functionObjectIds)
  const cleanFunctionLocations = CleanFunctionLocations.cleanFunctionLocations(fnResult5, fnResult3, functionLocations)
  return cleanFunctionLocations
}
