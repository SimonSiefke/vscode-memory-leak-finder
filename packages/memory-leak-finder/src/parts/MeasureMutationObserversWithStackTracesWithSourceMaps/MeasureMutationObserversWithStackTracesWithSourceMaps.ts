import * as GetMutationObserverCount from '../GetMutationObserverCount/GetMutationObserverCount.ts'
import * as GetMutationObserversWithStackTraces from '../GetMutationObserversWithStackTraces/GetMutationObserversWithStackTraces.ts'
import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as PrettifyConstructorStackTracesWithSourceMap from '../PrettifyConstructorStackTracesWithSourceMap/PrettifyConstructorStackTracesWithSourceMap.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as StartTrackingMutationObserverStackTraces from '../StartTrackingMutationObserverStackTraces/StartTrackingMutationObserverStackTraces.ts'
import * as StopTrackingMutationObserverStackTraces from '../StopTrackingMutationObserverStackTraces/StopTrackingMutationObserverStackTraces.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.MutationObserversWithStackTracesWithSourceMaps

export const targets = [TargetId.Browser]

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler]
}

export const start = async (session, objectGroup, scriptHandler: IScriptHandler) => {
  await scriptHandler.start(session)
  await StartTrackingMutationObserverStackTraces.startTrackingMutationObserverStackTraces(session, objectGroup)
  return GetMutationObserverCount.getMutationObserverCount(session)
}

export const stop = async (session, objectGroup, scriptHandler: IScriptHandler) => {
  await scriptHandler.stop(session)
  const added = await GetMutationObserversWithStackTraces.getMutationObserversWithStackTraces(session, objectGroup)
  await StopTrackingMutationObserverStackTraces.stopTrackingMutationObserverStackTraces(session, objectGroup)
  const pretty = await PrettifyConstructorStackTracesWithSourceMap.prettifyConstructorStackTracesWithSourceMap(
    added,
    scriptHandler.scriptMap,
  )
  // console.log({ scriptMap, added })
  return pretty
}

export const compare = (before, after) => {
  return after
}

export const isLeak = (leaked) => {
  return leaked.length > 0
}
