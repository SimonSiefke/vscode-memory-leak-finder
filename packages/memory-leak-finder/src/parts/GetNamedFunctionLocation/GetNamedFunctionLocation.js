import * as Assert from '../Assert/Assert.js'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as IsFunctionLocation from '../IsFunctionLocation/IsFunctionLocation.js'

const emptyFunctionLocation = {
  scriptId: '',
  lineNumber: 0,
  columnNumber: 0,
}

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

const getFunctionLocationProperty = (fnResult) => {
  const functionLocation = fnResult.internalProperties.find(IsFunctionLocation.isFunctionLocation)
  if (!functionLocation) {
    return emptyFunctionLocation
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
  Assert.string(objectId)
  if (!objectId) {
    return {
      ...emptyFunctionLocation,
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
  const functionLocation = getFunctionLocationProperty(fnResult1)
  const functionName = getFunctionNameProperty(fnResult1)
  const functionUrl = getFunctionUrl(functionLocation, scriptMap)
  return {
    ...functionLocation,
    objectId,
    name: functionName,
    url: functionUrl,
  }
}
