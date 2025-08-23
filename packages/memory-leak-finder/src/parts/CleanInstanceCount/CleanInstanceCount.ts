import * as Assert from '../Assert/Assert.ts'
import * as FormatUrl from '../FormatUrl/FormatUrl.ts'
import * as GetSourceMapUrlFromScriptMap from '../GetSourceMapUrlFromScriptMap/GetSourceMapUrlFromScriptMap.ts'

const getStack = (url, lineNumber, columnNumber) => {
  if (!url) {
    return []
  }
  const formattedUrl = FormatUrl.formatUrl(url, lineNumber, columnNumber)
  return [formattedUrl]
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
