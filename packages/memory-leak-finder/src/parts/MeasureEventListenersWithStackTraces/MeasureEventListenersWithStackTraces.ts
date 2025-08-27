import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'
import * as AddStackTracesToEventListeners from '../AddStackTracesToEventListeners/AddStackTracesToEventListeners.ts'
import * as CompareEventListenersWithStackTraces from '../CompareEventListenersWithStackTraces/CompareEventListenersWithStackTraces.ts'
import * as GetEventListeners from '../GetEventListeners/GetEventListeners.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as StartTrackEventListenerStackTraces from '../StartTrackEventListenerStackTraces/StartTrackEventListenerStackTraces.ts'
import * as StopTrackingEventListenerStackTraces from '../StopTrackingEventListenerStackTraces/StopTrackingEventListenerStackTraces.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.EventListenersWithStackTrace

export const targets = [TargetId.Browser]

/**
 *
 * @param {any} session
 */

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler]
}

export const start = async (session, objectGroup, scriptHandler: IScriptHandler) => {
  await scriptHandler.start(session)
  await StartTrackEventListenerStackTraces.startTrackingEventListenerStackTraces(session, objectGroup)
  const result = await GetEventListeners.getEventListeners(session, objectGroup, scriptHandler.scriptMap)
  return result
}

export const stop = async (session, objectGroup, scriptHandler: IScriptHandler) => {
  await scriptHandler.stop(session)
  const result = await GetEventListeners.getEventListeners(session, objectGroup, scriptHandler.scriptMap)
  const resultWithStackTraces = await AddStackTracesToEventListeners.addStackTracesToEventListeners(session, result)
  await StopTrackingEventListenerStackTraces.stopTrackingEventListenerStackTraces(session, objectGroup)
  return resultWithStackTraces
}

export const releaseResources = async (session, objectGroup) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}

export const compare = CompareEventListenersWithStackTraces.compareEventListenersWithStackTraces

export const isLeak = (leakedEventListeners) => {
  return leakedEventListeners.length > 0
}
