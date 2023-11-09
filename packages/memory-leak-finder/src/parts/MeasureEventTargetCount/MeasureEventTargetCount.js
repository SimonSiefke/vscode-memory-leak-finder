import * as GetEventTargetCount from '../GetEventTargetCount/GetEventTargetCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'

export const id = MeasureId.EventTarget

export const create = (session) => {
  return [session]
}

export const start = (session) => {
  return GetEventTargetCount.getEventTargetCount(session)
}

export const stop = (session) => {
  return GetEventTargetCount.getEventTargetCount(session)
}

export const compare = (before, after) => {
  return {
    before,
    after,
  }
}
