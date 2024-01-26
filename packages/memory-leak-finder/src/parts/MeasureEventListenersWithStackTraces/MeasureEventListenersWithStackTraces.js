import * as AddStackTracesToEventListeners from '../AddStackTracesToEventListeners/AddStackTracesToEventListeners.js'
import * as CompareEventListenersWithStackTraces from '../CompareEventListenersWithStackTraces/CompareEventListenersWithStackTraces.js'
import * as GetEventListeners from '../GetEventListeners/GetEventListeners.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.js'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.js'
import * as StartTrackEventListenerStackTraces from '../StartTrackEventListenerStackTraces/StartTrackEventListenerStackTraces.js'
import * as StopTrackingEventListenerStackTraces from '../StopTrackingEventListenerStackTraces/StopTrackingEventListenerStackTraces.js'

export const id = MeasureId.EventListenersWithStackTrace

/**
 *
 * @param {any} session
 */

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler]
}

export const start = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.start(session)
  await StartTrackEventListenerStackTraces.startTrackingEventListenerStackTraces(session, objectGroup)
  const result = await GetEventListeners.getEventListeners(session, objectGroup, scriptHandler.scriptMap)
  return result
}

export const stop = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.stop(session)
  const result = await GetEventListeners.getEventListeners(session, objectGroup, scriptHandler.scriptMap)
  const resultWithStackTraces = await AddStackTracesToEventListeners.addStackTracesToEventListeners(session, result)
  await StopTrackingEventListenerStackTraces.stopTrackingEventListenerStackTraces(session, objectGroup)
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
  return resultWithStackTraces
}

export const compare = CompareEventListenersWithStackTraces.compareEventListenersWithStackTraces

export const isLeak = (leakedEventListeners) => {
  return leakedEventListeners.length > 0
}
