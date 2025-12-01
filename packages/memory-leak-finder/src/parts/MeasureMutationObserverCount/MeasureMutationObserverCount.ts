import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetMutationObserverCount from '../GetMutationObserverCount/GetMutationObserverCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.MutationObserverCount

export const targets = [TargetId.Browser]

export const create = (session) => {
  return [session]
}

export const start = (session) => {
  return GetMutationObserverCount.getMutationObserverCount(session)
}

export const stop = (session) => {
  return GetMutationObserverCount.getMutationObserverCount(session)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
