import { comparePromisesWithStackTrace } from '../ComparePromisesWithStackTrace/ComparePromisesWithStackTrace.ts'
import * as GetPromisesWithStackTraces from '../GetPromisesWithStackTraces/GetPromisesWithStackTraces.ts'
import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as StartTrackPromiseStackTraces from '../StartTrackPromiseStackTraces/StartTrackingPromiseStackTraces.ts'
import * as StopTrackingPromiseStackTraces from '../StopTrackPromiseStackTraces/StopTrackingPromiseStackTraces.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'

export const id = MeasureId.PromisesWithStackTrace

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session) => {
  const objectGroup1 = ObjectGroupId.create()
  const objectGroup2 = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup1, objectGroup2, scriptHandler]
}

export const start = async (session, objectGroup1, objectGroup2, scriptHandler: IScriptHandler) => {
  await scriptHandler.start(session)
  await StartTrackPromiseStackTraces.startTrackingPromiseStackTraces(session, objectGroup1)
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup1)
  return GetPromisesWithStackTraces.getPromisesWithStackTraces(session, objectGroup1)
}

export const stop = async (session, objectGroup1, objectGroup2, scriptHandler: IScriptHandler) => {
  await scriptHandler.stop(session)
  const promises = await GetPromisesWithStackTraces.getPromisesWithStackTraces(session, objectGroup2)
  await StopTrackingPromiseStackTraces.stopTrackingPromiseStackTraces(session, objectGroup2)
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup2)
  return {
    result: promises,
    scriptMap: scriptHandler.scriptMap,
  }
}

export const compare = comparePromisesWithStackTrace

export const isLeak = (leaked) => {
  return leaked.length > 0
}
