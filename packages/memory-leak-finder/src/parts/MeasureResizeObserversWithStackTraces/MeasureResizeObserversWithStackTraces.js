import * as MeasureId from '../MeasureId/MeasureId.js'
import * as GetResizeObserverCount from '../GetResizeObserverCount/GetResizeObserverCount.js'
import * as CompareCount from '../CompareCount/CompareCount.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'

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
