import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetEventListenerCount from '../GetEventListenerCount/GetEventListenerCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'

export const id = MeasureId.EventListenerCount

export const create = (session) => {
  return [session]
}

export const start = (session) => {
  return GetEventListenerCount.getEventListenerCount(session)
}

export const stop = (session) => {
  return GetEventListenerCount.getEventListenerCount(session)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
