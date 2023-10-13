import * as GetDetachedDomNodeCount from '../GetDetachedDomNodeCount/GetDetachedDomNodeCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'

export const id = MeasureId.DetachedDomNodeCount

export const create = (session) => {
  return [session]
}

export const start = (session) => {
  return GetDetachedDomNodeCount.getDetachedDomNodeCount(session)
}

export const stop = (session) => {
  return GetDetachedDomNodeCount.getDetachedDomNodeCount(session)
}

export const compare = (before, after) => {
  return {
    before,
    after,
  }
}

export const isLeak = (before, after) => {
  return after > before
}
