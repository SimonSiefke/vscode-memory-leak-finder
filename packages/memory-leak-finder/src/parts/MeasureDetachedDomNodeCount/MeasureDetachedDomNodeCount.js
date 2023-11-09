import * as GetDetachedDomNodeCount from '../GetDetachedDomNodeCount/GetDetachedDomNodeCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as CompareCount from '../CompareCount/CompareCount.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'

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

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
