import * as GetResizeObserverCount from '../GetResizeObserverCount/GetResizeObserverCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'

export const id = MeasureId.ResizeObserverCount

export const create = (session) => {
  return [session]
}

export const start = (session) => {
  return GetResizeObserverCount.getResizeObserverCount(session)
}

export const stop = (session) => {
  return GetResizeObserverCount.getResizeObserverCount(session)
}

export const compare = (before, after) => {
  return {
    before,
    after,
  }
}
