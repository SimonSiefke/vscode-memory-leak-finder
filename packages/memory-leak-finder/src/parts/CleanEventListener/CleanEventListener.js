import * as Assert from '../Assert/Assert.js'
import { cleanEventListenerDescription } from '../CleanEventListenerDescription/CleanEventListenerDescription.js'
import * as FormatUrl from '../FormatUrl/FormatUrl.js'
import * as GetPrettyEventListenerUrl from '../GetPrettyEventListenerUrl/GetPrettyEventListenerUrl.js'
import * as GetSourceMapUrlFromScriptMap from '../GetSourceMapUrlFromScriptMap/GetSourceMapUrlFromScriptMap.js'

export const cleanEventListener = (eventListener, scriptMap) => {
  Assert.object(eventListener)
  Assert.object(scriptMap)
  const { url, sourceMapUrl } = GetSourceMapUrlFromScriptMap.getSourceMapUrlFromScriptMap(eventListener.scriptId, scriptMap)
  const prettyUrl = GetPrettyEventListenerUrl.getPrettyEventListenerUrl(url)
  const formattedUrl = FormatUrl.formatUrl(prettyUrl, eventListener.lineNumber, eventListener.columnNumber)
  const stack = [`listener (${formattedUrl})`]
  const sourceMaps = [sourceMapUrl]
  return {
    type: eventListener.type,
    description: cleanEventListenerDescription(eventListener.handler.description),
    objectId: eventListener.handler.objectId,
    stack,
    sourceMaps,
  }
}
