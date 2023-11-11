import * as Assert from '../Assert/Assert.js'
import * as GetSourceMapUrlFromScriptMap from '../GetSourceMapUrlFromScriptMap/GetSourceMapUrlFromScriptMap.js'

export const cleanInstanceCount = (instance, constructorLocation, scriptMap) => {
  Assert.object(instance)
  Assert.object(constructorLocation)
  Assert.object(scriptMap)
  const { url, sourceMapUrl } = GetSourceMapUrlFromScriptMap.getSourceMapUrlFromScriptMap(constructorLocation.scriptId, scriptMap)
  return {
    ...instance,
    ...constructorLocation,
    stack: [`${url}:${constructorLocation.lineNumber}:${constructorLocation.columnNumber}`],
    sourceMaps: [sourceMapUrl],
  }
}
