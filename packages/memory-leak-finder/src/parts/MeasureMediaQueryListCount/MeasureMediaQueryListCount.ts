import * as GetMediaQueryListCount from '../GetMediaQueryListCount/GetMediaQueryListCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'

export const id = MeasureId.MediaQueryListCount

export const create = (session) => {
  return [session]
}

export const start = (session) => {
  return GetMediaQueryListCount.getMediaQueryListCount(session)
}

export const stop = (session) => {
  return GetMediaQueryListCount.getMediaQueryListCount(session)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
