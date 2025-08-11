import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetEditContextCount from '../GetEditContextCount/GetEditContextCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'

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
