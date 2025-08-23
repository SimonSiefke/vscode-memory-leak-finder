import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetIntersectionObserverCount from '../GetIntersectionObserverCount/GetIntersectionObserverCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'

export const id = MeasureId.IntersectionObserverCount

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
