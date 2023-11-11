import * as Assert from '../Assert/Assert.js'
import { cleanEventListenerDescription } from '../CleanEventListenerDescription/CleanEventListenerDescription.js'
import * as GetPrettyEventListenerUrl from '../GetPrettyEventListenerUrl/GetPrettyEventListenerUrl.js'
import * as GetSourceMapUrlFromScriptMap from '../GetSourceMapUrlFromScriptMap/GetSourceMapUrlFromScriptMap.js'

export const cleanEventListener = (eventListener, scriptMap) => {
  Assert.object(eventListener)
  Assert.object(scriptMap)
  const { url, sourceMapUrl } = GetSourceMapUrlFromScriptMap.getSourceMapUrlFromScriptMap(eventListener.scriptId, scriptMap)
  const prettyUrl = GetPrettyEventListenerUrl.getPrettyEventListenerUrl(url)
  const stack = [`listener (${prettyUrl}:${eventListener.lineNumber}:${eventListener.columnNumber})`]
  const sourceMaps = [sourceMapUrl]
  return {
    type: eventListener.type,
    description: cleanEventListenerDescription(eventListener.handler.description),
    objectId: eventListener.handler.objectId,
    stack,
    sourceMaps,
  }
}
