import { cleanEventListenerDescription } from '../CleanEventListenerDescription/CleanEventListenerDescription.js'
import * as Assert from '../Assert/Assert.js'

const RE_LOCAL_HOST = /^http:\/\/localhost:\d+/

const cleanUrl = (url) => {
  return url.replace(RE_LOCAL_HOST, '')
}

const getUrl = (eventListener, scriptMap) => {
  const scriptId = eventListener.scriptId
  if (scriptId in scriptMap) {
    const rawUrl = scriptMap[scriptId].url
    return cleanUrl(rawUrl)
  }
  return ''
}

const getPrettyUrl = (url) => {
  if (url.startsWith('/')) {
    return url.slice(1)
  }
  return url
}

export const cleanEventListener = (eventListener, scriptMap) => {
  Assert.object(eventListener)
  Assert.object(scriptMap)
  const url = getUrl(eventListener, scriptMap)
  const prettyUrl = getPrettyUrl(url)
  const stack = [`listener (${prettyUrl}:${eventListener.lineNumber}:${eventListener.columnNumber})`]
  return {
    type: eventListener.type,
    description: cleanEventListenerDescription(eventListener.handler.description),
    objectId: eventListener.handler.objectId,
    stack,
  }
}
