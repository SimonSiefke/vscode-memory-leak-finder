import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as GetMutationObserverCount from '../GetMutationObserverCount/GetMutationObserverCount.ts'
import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'

export const id = MeasureId.MutationObserverCount

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
