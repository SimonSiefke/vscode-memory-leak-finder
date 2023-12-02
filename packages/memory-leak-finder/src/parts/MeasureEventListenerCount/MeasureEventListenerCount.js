import * as CompareCount from '../CompareCount/CompareCount.js'
import * as GetEventListenerCount from '../GetEventListenerCount/GetEventListenerCount.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'

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
