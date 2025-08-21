import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as GetResizeObserverCount from '../GetResizeObserverCount/GetResizeObserverCount.ts'
import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'

export const id = MeasureId.ResizeObserversWithStackTraces

export const create = (session) => {
  return [session]
}

export const start = (session) => {
  return GetResizeObserverCount.getResizeObserverCount(session)
}

export const stop = (session) => {
  return GetResizeObserverCount.getResizeObserverCount(session)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
