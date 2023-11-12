import * as Assert from '../Assert/Assert.js'
import * as GetSourceMapUrlFromScriptMap from '../GetSourceMapUrlFromScriptMap/GetSourceMapUrlFromScriptMap.js'

const getStack = (url, lineNumber, columnNumber) => {
  if (!url) {
    return []
  }
  return [`${url}:${lineNumber}:${columnNumber}`]
}

const getSourceMaps = (sourceMapUrl) => {
  if (!sourceMapUrl) {
    return []
  }
  return [sourceMapUrl]
}

export const cleanInstanceCount = (instance, constructorLocation, scriptMap) => {
  Assert.object(instance)
  Assert.object(constructorLocation)
  Assert.object(scriptMap)
  const { url, sourceMapUrl } = GetSourceMapUrlFromScriptMap.getSourceMapUrlFromScriptMap(constructorLocation.scriptId, scriptMap)
  return {
    ...instance,
    ...constructorLocation,
    stack: getStack(url, constructorLocation.lineNumber, constructorLocation.columnNumber),
    sourceMaps: getSourceMaps(sourceMapUrl),
  }
}
