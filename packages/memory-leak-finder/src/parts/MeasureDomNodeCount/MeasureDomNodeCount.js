import * as GetDomNodeCount from '../GetDomNodeCount/GetDomNodeCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as CompareCount from '../CompareCount/CompareCount.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'

export const id = MeasureId.DetachedDomNodeCount

export const create = (session) => {
  return [session]
}

export const start = (session) => {
  return GetDomNodeCount.getDomNodeCount(session)
}

export const stop = (session) => {
  return GetDomNodeCount.getDomNodeCount(session)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
