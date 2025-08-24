import * as GetMutationObserverCount from '../GetMutationObserverCount/GetMutationObserverCount.ts'
import * as GetMutationObserversWithStackTraces from '../GetMutationObserversWithStackTraces/GetMutationObserversWithStackTraces.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as StartTrackingMutationObserverStackTraces from '../StartTrackingMutationObserverStackTraces/StartTrackingMutationObserverStackTraces.ts'
import * as StopTrackingMutationObserverStackTraces from '../StopTrackingMutationObserverStackTraces/StopTrackingMutationObserverStackTraces.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.MutationObserversWithStackTraces

export const targets = [TargetId.Browser]

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = async (session, objectGroup) => {
  await StartTrackingMutationObserverStackTraces.startTrackingMutationObserverStackTraces(session, objectGroup)
  return GetMutationObserverCount.getMutationObserverCount(session)
}

export const stop = async (session, objectGroup) => {
  const added = await GetMutationObserversWithStackTraces.getMutationObserversWithStackTraces(session, objectGroup)
  await StopTrackingMutationObserverStackTraces.stopTrackingMutationObserverStackTraces(session, objectGroup)
  return added
}

export const compare = (before, after) => {
  return after
}

export const isLeak = (leaked) => {
  return leaked.length > 0
}
