import * as Assert from '../Assert/Assert.ts'
import * as FormatUrl from '../FormatUrl/FormatUrl.ts'
import * as GetSourceMapUrlFromScriptMap from '../GetSourceMapUrlFromScriptMap/GetSourceMapUrlFromScriptMap.ts'

const getStack = (url: string | null | undefined, lineNumber: number, columnNumber: number): readonly string[] => {
  if (!url) {
    return []
  }
  const formattedUrl = FormatUrl.formatUrl(url, lineNumber, columnNumber)
  return [formattedUrl]
}

const getSourceMaps = (sourceMapUrl: string | null | undefined): readonly string[] => {
  if (!sourceMapUrl) {
    return []
  }
  return [sourceMapUrl]
}

export const cleanInstanceCount = (instance: Record<string, unknown>, constructorLocation: { scriptId: string; lineNumber: number; columnNumber: number }, scriptMap: unknown): Record<string, unknown> => {
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
