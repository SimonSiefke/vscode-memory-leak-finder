import * as Assert from '../Assert/Assert.js'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as EmptyFunctionLocation from '../EmptyFunctionLocation/EmptyFunctionLocation.js'
import * as GetFunctionNameProperty from '../GetFunctionNameProperty/GetFunctionNameProperty.js'
import * as GetFunctionUrl from '../GetFunctionUrl/GetFunctionUrl.js'
import * as GetNamedFunctionLocationProperty from '../GetNamedFunctionLocationProperty/GetNamedFunctionLocationProperty.js'

export const getFunctionSourceMapUrl = (functionLocation, scriptMap) => {
  const match = scriptMap[functionLocation.scriptId]
  if (!match) {
    return ''
  }
  return match.sourceMapUrl
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
      url: '',
      sourceMapUrl: '',
    }
  }
  const fnResult1 = await DevtoolsProtocolRuntime.getProperties(session, {
    objectId,
    accessorPropertiesOnly: false,
    nonIndexedPropertiesOnly: false,
    generatePreview: false,
    ownProperties: true,
  })
  const functionLocation = await GetNamedFunctionLocationProperty.getNamedFunctionLocationProperty(
    session,
    fnResult1,
    scriptMap,
    getNamedFunctionLocation,
  )
  const functionName = GetFunctionNameProperty.getFunctionNameProperty(fnResult1)
  const functionUrl = GetFunctionUrl.getFunctionUrl(functionLocation, scriptMap)
  const functionSourceMapUrl = getFunctionSourceMapUrl(functionLocation, scriptMap)
  return {
    ...functionLocation,
    objectId,
    name: functionName,
    url: functionUrl,
    sourceMapUrl: functionSourceMapUrl,
  }
}
