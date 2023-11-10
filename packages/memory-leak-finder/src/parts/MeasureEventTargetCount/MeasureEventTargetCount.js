import * as GetEventTargetCount from '../GetEventTargetCount/GetEventTargetCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as CompareCount from '../CompareCount/CompareCount.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'

export const id = MeasureId.EventTargetCount

export const create = (session) => {
  return [session]
}

export const start = (session) => {
  return GetEventTargetCount.getEventTargetCount(session)
}

export const stop = (session) => {
  return GetEventTargetCount.getEventTargetCount(session)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
