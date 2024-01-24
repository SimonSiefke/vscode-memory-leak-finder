import * as Assert from '../Assert/Assert.js'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as IsFunctionLocation from '../IsFunctionLocation/IsFunctionLocation.js'

const emptyFunctionLocation = {
  scriptId: '',
  lineNumber: 0,
  columnNumber: 0,
  name: '',
}

const isFunctionName = (value) => {
  return value === 'name'
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

export const getNamedFunctionLocation = async (session, objectId) => {
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
  return {
    ...functionLocation,
    objectId,
    name: functionName,
  }
}
