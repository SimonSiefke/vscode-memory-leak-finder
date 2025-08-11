import * as CompareCount from '../CompareCount/CompareCount.js'
import * as GetIntersectionObserverCount from '../GetIntersectionObserverCount/GetIntersectionObserverCount.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'

export const id = MeasureId.IntersectionObserversWithStackTraces

export const create = (session) => {
  return [session]
}

export const start = (session) => {
  return GetIntersectionObserverCount.getIntersectionObserverCount(session)
}

export const stop = (session) => {
  return GetIntersectionObserverCount.getIntersectionObserverCount(session)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
