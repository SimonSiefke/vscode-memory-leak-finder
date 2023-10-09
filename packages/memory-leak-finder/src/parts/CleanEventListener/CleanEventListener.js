import { cleanEventListenerDescription } from '../CleanEventListenerDescription/CleanEventListenerDescription.js'
import * as Assert from '../Assert/Assert.js'
import * as GetPrettyEventListenerUrl from '../GetPrettyEventListenerUrl/GetPrettyEventListenerUrl.js'

const RE_LOCAL_HOST = /^http:\/\/localhost:\d+/

const cleanUrl = (url) => {
  return url.replace(RE_LOCAL_HOST, '')
}

const getUrl = (eventListener, scriptMap) => {
  const scriptId = eventListener.scriptId
  if (scriptId in scriptMap) {
    const entry = scriptMap[scriptId]
    const { url, sourceMapUrl } = entry
    return {
      url: cleanUrl(url),
      sourceMapUrl,
    }
  }
  return {
    url: '',
    sourceMapUrl: '',
  }
}

export const cleanEventListener = (eventListener, scriptMap) => {
  Assert.object(eventListener)
  Assert.object(scriptMap)
  const { url, sourceMapUrl } = getUrl(eventListener, scriptMap)
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
