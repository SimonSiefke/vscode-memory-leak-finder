import * as CompareCount from '../CompareCount/CompareCount.js'
import * as GetClassCount from '../GetClassCount/GetClassCount.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'

export const id = MeasureId.ClassCount

export const create = (session) => {
  return [session]
}

export const start = (session) => {
  return GetClassCount.getClassCount(session)
}

export const stop = (session) => {
  return GetClassCount.getClassCount(session)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
