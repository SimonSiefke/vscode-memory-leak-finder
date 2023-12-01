import * as AddStackTracesToEventListeners from '../AddStackTracesToEventListeners/AddStackTracesToEventListeners.js'
import * as CompareEventListenersWithStackTraces from '../CompareEventListenersWithStackTraces/CompareEventListenersWithStackTraces.js'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as GetEventListeners from '../GetEventListeners/GetEventListeners.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as StartTrackEventListenerStackTraces from '../StartTrackEventListenerStackTraces/StartTrackEventListenerStackTraces.js'
import * as StopTrackingEventListenerStackTraces from '../StopTrackingEventListenerStackTraces/StopTrackingEventListenerStackTraces.js'

export const id = MeasureId.EventListenersWithStackTrace

/**
 *
 * @param {any} session
 */

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptMap = Object.create(null)
  const handleScriptParsed = (event) => {
    const { url, scriptId, sourceMapURL } = event.params
    if (!url) {
      return
    }
    scriptMap[scriptId] = {
      url,
      sourceMapUrl: sourceMapURL,
    }
  }
  session.on('Debugger.scriptParsed', handleScriptParsed)
  return [session, objectGroup, scriptMap, handleScriptParsed]
}

export const start = async (session, objectGroup, scriptMap) => {
  await session.invoke('Debugger.enable')
  await StartTrackEventListenerStackTraces.startTrackingEventListenerStackTraces(session, objectGroup)
  const result = await GetEventListeners.getEventListeners(session, objectGroup, scriptMap)
  return result
}

export const stop = async (session, objectGroup, scriptMap, handleScriptParsed) => {
  session.off('Debugger.scriptParsed', handleScriptParsed)
  await session.invoke('Debugger.disable')
  const result = await GetEventListeners.getEventListeners(session, objectGroup, scriptMap)
  const resultWithStackTraces = await AddStackTracesToEventListeners.addStackTracesToEventListeners(session, result)
  await StopTrackingEventListenerStackTraces.stopTrackingEventListenerStackTraces(session, objectGroup)
  await DevtoolsProtocolRuntime.releaseObjectGroup(session, {
    objectGroup,
  })
  return resultWithStackTraces
}

export const compare = CompareEventListenersWithStackTraces.compareEventListenersWithStackTraces

export const isLeak = (leakedEventListeners) => {
  return leakedEventListeners.length > 0
}
