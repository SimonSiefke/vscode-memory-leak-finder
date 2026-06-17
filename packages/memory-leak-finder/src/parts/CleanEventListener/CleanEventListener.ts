import * as Assert from '../Assert/Assert.ts'
import { cleanEventListenerDescription } from '../CleanEventListenerDescription/CleanEventListenerDescription.ts'
import * as FormatUrl from '../FormatUrl/FormatUrl.ts'
import * as GetPrettyEventListenerUrl from '../GetPrettyEventListenerUrl/GetPrettyEventListenerUrl.ts'
import * as GetSourceMapUrlFromScriptMap from '../GetSourceMapUrlFromScriptMap/GetSourceMapUrlFromScriptMap.ts'

type EventListener = {
  readonly handler: { description: string; objectId: string }
  readonly lineNumber: number
  readonly columnNumber: number
  readonly scriptId: string
  readonly type: string
  readonly [key: string]: unknown
}

export const cleanEventListener = (eventListener: EventListener, scriptMap: unknown) => {
  Assert.object(eventListener)
  Assert.object(scriptMap)
  const { sourceMapUrl, url } = GetSourceMapUrlFromScriptMap.getSourceMapUrlFromScriptMap(eventListener.scriptId, scriptMap)
  const prettyUrl = GetPrettyEventListenerUrl.getPrettyEventListenerUrl(url)
  const formattedUrl = FormatUrl.formatUrl(prettyUrl, eventListener.lineNumber, eventListener.columnNumber)
  const stack = [`listener (${formattedUrl})`]
  const sourceMaps = [sourceMapUrl]
  return {
    description: cleanEventListenerDescription(eventListener.handler.description),
    objectId: eventListener.handler.objectId,
    sourceMaps,
    stack,
    type: eventListener.type,
  }
}
