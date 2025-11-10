import * as ComparePromises from '../ComparePromises/ComparePromises.ts'
import * as GetPromises from '../GetPromises/GetPromises.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'
import * as AddStackTracesToEventListeners from '../AddStackTracesToEventListeners/AddStackTracesToEventListeners.ts'
import * as CompareEventListenersWithStackTraces from '../CompareEventListenersWithStackTraces/CompareEventListenersWithStackTraces.ts'
import * as GetEventListeners from '../GetEventListeners/GetEventListeners.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as StartTrackEventListenerStackTraces from '../StartTrackEventListenerStackTraces/StartTrackEventListenerStackTraces.ts'
import * as StopTrackingPromiseStackTraces from '../StopTrackPromiseStackTraces/StopTrackingPromiseStackTraces.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.PromisesWithStackTrace

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()

  return [session, objectGroup, scriptHandler]
}

export const start = async (session, objectGroup, scriptHandler: IScriptHandler) => {
  await scriptHandler.start(session)
  await StartTrackEventListenerStackTraces.startTrackingEventListenerStackTraces(session, objectGroup)
  return GetPromises.getPromises(session, objectGroup)
}

export const stop = async (session, objectGroup, scriptHandler: IScriptHandler) => {
  await scriptHandler.stop(session)
  await StopTrackingPromiseStackTraces.stopTrackingPromiseStackTraces(session, objectGroup)
  return GetPromises.getPromises(session, objectGroup)
}

export const compare = ComparePromises.comparePromises

export const isLeak = (result) => {
  return result.after.length > result.before.length
}
