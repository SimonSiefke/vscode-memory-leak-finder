import * as GetEventListenerCount from '../GetEventListenerCount/GetEventListenerCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as Assert from '../Assert/Assert.js'

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

export const compare = (before, after) => {
  Assert.number(before)
  Assert.number(after)
  console.log({ before, after })
  return {
    before,
    after,
  }
}
