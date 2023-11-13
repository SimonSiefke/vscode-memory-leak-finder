import * as MeasureId from '../MeasureId/MeasureId.js'
import * as GetMutationObserverCount from '../GetMutationObserverCount/GetMutationObserverCount.js'
import * as CompareCount from '../CompareCount/CompareCount.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'

export const id = MeasureId.MutationObserversWithStackTraces

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
