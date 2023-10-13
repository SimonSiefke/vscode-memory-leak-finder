import * as GetIntersectionObserverCount from '../GetIntersectionObserverCount/GetIntersectionObserverCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'

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

export const compare = (before, after) => {
  return {
    before,
    after,
  }
}
