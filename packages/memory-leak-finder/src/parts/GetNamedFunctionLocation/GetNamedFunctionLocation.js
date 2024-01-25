import * as Assert from '../Assert/Assert.js'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as EmptyFunctionLocation from '../EmptyFunctionLocation/EmptyFunctionLocation.js'
import * as IsFunctionLocation from '../IsFunctionLocation/IsFunctionLocation.js'

const isFunctionName = (value) => {
  return value.name === 'name'
}

const getFunctionNameProperty = (fnResult) => {
  const match = fnResult.result.find(isFunctionName)
  if (!match) {
    return ''
  }
  return match.value.value
}

const isBoundFunctionProperty = (value) => {
  return value.name === '[[TargetFunction]]'
}

const getBoundFunctionValue = (fnResult) => {
  return fnResult.internalProperties.find(isBoundFunctionProperty)
}

const getFunctionLocationProperty = (session, fnResult, scriptMap) => {
  const functionLocation = fnResult.internalProperties.find(IsFunctionLocation.isFunctionLocation)
  if (!functionLocation) {
    const boundFunctionValue = getBoundFunctionValue(fnResult)
    if (!boundFunctionValue) {
      return EmptyFunctionLocation.emptyFunctionLocation
    }
    const boundFunctionObjectId = boundFunctionValue.value.objectId
    return getNamedFunctionLocation(boundFunctionObjectId, session, scriptMap)
  }
  return functionLocation.value.value
}

const getFunctionUrl = (functionLocation, scriptMap) => {
  const match = scriptMap[functionLocation.scriptId]
  if (!match) {
    return ''
  }
  return match.url
}

export const getNamedFunctionLocation = async (objectId, session, scriptMap) => {
  Assert.object(session)
  Assert.object(scriptMap)
  Assert.string(objectId)
  if (!objectId) {
    return {
      ...EmptyFunctionLocation.emptyFunctionLocation,
      objectId,
      name: '',
    }
  }
  const fnResult1 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId,
    accessorPropertiesOnly: false,
    nonIndexedPropertiesOnly: false,
    generatePreview: false,
    ownProperties: true,
  })
  const functionLocation = await getFunctionLocationProperty(session, fnResult1, scriptMap)
  const functionName = getFunctionNameProperty(fnResult1)
  const functionUrl = getFunctionUrl(functionLocation, scriptMap)
  return {
    ...functionLocation,
    objectId,
    name: functionName,
    url: functionUrl,
  }
}
