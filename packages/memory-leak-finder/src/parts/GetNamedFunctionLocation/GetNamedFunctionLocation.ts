import * as Assert from '../Assert/Assert.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as EmptyFunctionLocation from '../EmptyFunctionLocation/EmptyFunctionLocation.ts'
import * as GetFunctionNameProperty from '../GetFunctionNameProperty/GetFunctionNameProperty.ts'
import * as GetFunctionUrl from '../GetFunctionUrl/GetFunctionUrl.ts'
import * as GetNamedFunctionLocationProperty from '../GetNamedFunctionLocationProperty/GetNamedFunctionLocationProperty.ts'

export const getFunctionSourceMapUrl = (functionLocation, scriptMap) => {
  const match = scriptMap[functionLocation.scriptId]
  if (!match) {
    return ''
  }
  return match.sourceMapUrl
}

export const getNamedFunctionLocation = async (objectId, session, scriptMap, includeSourceMap) => {
  Assert.object(session)
  Assert.object(scriptMap)
  Assert.string(objectId)
  if (!objectId) {
    return {
      ...EmptyFunctionLocation.emptyFunctionLocation,
      name: '',
      objectId,
      sourceMapUrl: '',
      url: '',
    }
  }
  const fnResult1 = await DevtoolsProtocolRuntime.getProperties(session, {
    accessorPropertiesOnly: false,
    generatePreview: false,
    nonIndexedPropertiesOnly: false,
    objectId,
    ownProperties: true,
  })
  const functionLocation = await GetNamedFunctionLocationProperty.getNamedFunctionLocationProperty(
    session,
    fnResult1,
    scriptMap,
    includeSourceMap,
    getNamedFunctionLocation,
  )
  const functionName = GetFunctionNameProperty.getFunctionNameProperty(fnResult1)
  const functionUrl = GetFunctionUrl.getFunctionUrl(functionLocation, scriptMap)
  const functionSourceMapUrl = getFunctionSourceMapUrl(functionLocation, scriptMap)
  return {
    ...functionLocation,
    name: functionName,
    objectId,
    sourceMapUrl: includeSourceMap ? functionSourceMapUrl : '',
    url: functionUrl,
  }
}
