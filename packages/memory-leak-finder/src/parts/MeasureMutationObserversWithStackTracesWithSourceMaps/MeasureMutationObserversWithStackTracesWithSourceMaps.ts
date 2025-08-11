import * as GetMutationObserverCount from '../GetMutationObserverCount/GetMutationObserverCount.js'
import * as GetMutationObserversWithStackTraces from '../GetMutationObserversWithStackTraces/GetMutationObserversWithStackTraces.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as PrettifyConstructorStackTracesWithSourceMap from '../PrettifyConstructorStackTracesWithSourceMap/PrettifyConstructorStackTracesWithSourceMap.js'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.js'
import * as StartTrackingMutationObserverStackTraces from '../StartTrackingMutationObserverStackTraces/StartTrackingMutationObserverStackTraces.js'
import * as StopTrackingMutationObserverStackTraces from '../StopTrackingMutationObserverStackTraces/StopTrackingMutationObserverStackTraces.js'

export const id = MeasureId.MutationObserversWithStackTracesWithSourceMaps

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler]
}

export const start = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.start()
  await StartTrackingMutationObserverStackTraces.startTrackingMutationObserverStackTraces(session, objectGroup)
  return GetMutationObserverCount.getMutationObserverCount(session)
}

export const stop = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.stop()
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
