import type { Dynamic } from '../Types/Types.ts'
import * as Assert from '../Assert/Assert.ts'
import * as FormatUrl from '../FormatUrl/FormatUrl.ts'
import * as GetSourceMapUrlFromScriptMap from '../GetSourceMapUrlFromScriptMap/GetSourceMapUrlFromScriptMap.ts'
const getStack = (url: Dynamic, lineNumber: Dynamic, columnNumber: Dynamic) => {
  if (!url) {
    return []
  }
  const formattedUrl = FormatUrl.formatUrl(url, lineNumber, columnNumber)
  return [formattedUrl]
}
const getSourceMaps = (sourceMapUrl: Dynamic) => {
  if (!sourceMapUrl) {
    return []
  }
  return [sourceMapUrl]
}
export const cleanInstanceCount = (instance: Dynamic, constructorLocation: Dynamic, scriptMap: Dynamic) => {
  Assert.object(instance)
  Assert.object(constructorLocation)
  Assert.object(scriptMap)
  const { sourceMapUrl, url } = GetSourceMapUrlFromScriptMap.getSourceMapUrlFromScriptMap(constructorLocation.scriptId, scriptMap)
  return {
    ...instance,
    ...constructorLocation,
    sourceMaps: getSourceMaps(sourceMapUrl),
    stack: getStack(url, constructorLocation.lineNumber, constructorLocation.columnNumber),
  }
}
