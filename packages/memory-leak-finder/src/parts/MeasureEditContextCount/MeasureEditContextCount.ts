import * as CompareCount from '../CompareCount/CompareCount.js'
import * as GetEditContextCount from '../GetEditContextCount/GetEditContextCount.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'

export const id = MeasureId.EditContextCount

export const create = (session) => {
  return [session]
}

export const start = (session) => {
  return GetEditContextCount.getEditContextCount(session)
}

export const stop = (session) => {
  return GetEditContextCount.getEditContextCount(session)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
