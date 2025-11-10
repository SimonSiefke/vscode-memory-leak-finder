import { comparePromisesWithStackTrace } from '../ComparePromisesWithStackTrace/ComparePromisesWithStackTrace.ts'
import * as GetPromisesWithStackTraces from '../GetPromisesWithStackTraces/GetPromisesWithStackTraces.ts'
import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as StartTrackPromiseStackTraces from '../StartTrackPromiseStackTraces/StartTrackingPromiseStackTraces.ts'
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
  await StartTrackPromiseStackTraces.startTrackingPromiseStackTraces(session, objectGroup)
  return GetPromisesWithStackTraces.getPromisesWithStackTraces(session, objectGroup)
}

export const stop = async (session, objectGroup, scriptHandler: IScriptHandler) => {
  await scriptHandler.stop(session)
  const promises = await GetPromisesWithStackTraces.getPromisesWithStackTraces(session, objectGroup)
  await StopTrackingPromiseStackTraces.stopTrackingPromiseStackTraces(session, objectGroup)
  return {
    result: promises,
    scriptMap: scriptHandler.scriptMap,
  }
}

export const compare = comparePromisesWithStackTrace

export const isLeak = (leaked) => {
  return leaked.length > 0
}
