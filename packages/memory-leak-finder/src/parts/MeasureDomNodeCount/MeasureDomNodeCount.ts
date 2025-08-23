import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetDomNodeCount from '../GetDomNodeCount/GetDomNodeCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'

export const id = MeasureId.DetachedDomNodeCount

export const create = (session) => {
  return [session]
}

export const start = (session) => {
  return GetDomNodeCount.getDomNodeCount(session, undefined)
}

export const stop = (session) => {
  return GetDomNodeCount.getDomNodeCount(session, undefined)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
