import * as CleanEventListenerCount from '../CleanEventListenerCount/CleanEventListenerCount.js'
import * as CompareCount from '../CompareCount/CompareCount.js'
import * as GetEventListenerCount from '../GetEventListenerCount/GetEventListenerCount.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'

export const id = MeasureId.EventListenerCount

export const create = (session) => {
  return [session]
}

export const start = async (session) => {
  const listeners = await GetEventListenerCount.getEventListenerCount(session)
  return CleanEventListenerCount.cleanEventListenerCount(listeners)
}

export const stop = async (session) => {
  const listeners = await GetEventListenerCount.getEventListenerCount(session)
  return CleanEventListenerCount.cleanEventListenerCount(listeners)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
