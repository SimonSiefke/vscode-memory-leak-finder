import * as CompareCount from '../CompareCount/CompareCount.js'
import * as GetMutationObserverCount from '../GetMutationObserverCount/GetMutationObserverCount.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as StartTrackingMutationObserverStackTraces from '../StartTrackingMutationObserverStackTraces/StartTrackingMutationObserverStackTraces.js'
import * as StopTrackingMutationObserverStackTraces from '../StopTrackingMutationObserverStackTraces/StopTrackingMutationObserverStackTraces.js'

export const id = MeasureId.MutationObserversWithStackTraces

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = async (session, objectGroup) => {
  await StartTrackingMutationObserverStackTraces.startTrackingMutationObserverStackTraces(session, objectGroup)
  return GetMutationObserverCount.getMutationObserverCount(session)
}

export const stop = async (session, objectGroup) => {
  await StopTrackingMutationObserverStackTraces.stopTrackingMutationObserverStackTraces(session, objectGroup)
  return GetMutationObserverCount.getMutationObserverCount(session)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
