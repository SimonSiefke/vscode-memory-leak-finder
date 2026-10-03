import type { Dynamic } from '../Types/Types.ts'
import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'
import type { Session } from '../Session/Session.ts'
import * as AddStackTracesToEventListeners from '../AddStackTracesToEventListeners/AddStackTracesToEventListeners.ts'
import * as CompareEventListenersWithFullStackTraces from '../CompareEventListenersWithFullStackTraces/CompareEventListenersWithFullStackTraces.ts'
import * as GetEventListeners from '../GetEventListeners/GetEventListeners.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as StopTrackingEventListenerStackTraces from '../StopTrackingEventListenerStackTraces/StopTrackingEventListenerStackTraces.ts'

export {
  create,
  isLeak,
  releaseResources,
  start,
  targets,
} from '../MeasureEventListenersWithStackTraces/MeasureEventListenersWithStackTraces.ts'

export const id = MeasureId.EventListenersWithFullStackTraces

export const stop = async (session: Session, objectGroup: Dynamic, scriptHandler: IScriptHandler) => {
  await scriptHandler.stop(session)
  const result = await GetEventListeners.getEventListeners(session, objectGroup, scriptHandler.scriptMap)
  const resultWithStackTraces = await AddStackTracesToEventListeners.addStackTracesToEventListeners(session, result)
  await StopTrackingEventListenerStackTraces.stopTrackingEventListenerStackTraces(session, objectGroup)
  return {
    result: resultWithStackTraces,
    scriptMap: scriptHandler.scriptMap,
  }
}

export const compare = CompareEventListenersWithFullStackTraces.compareEventListenersWithFullStackTraces
