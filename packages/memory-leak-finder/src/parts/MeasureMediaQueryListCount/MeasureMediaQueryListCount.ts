import * as GetMediaQueryListCount from '../GetMediaQueryListCount/GetMediaQueryListCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as CompareCount from '../CompareCount/CompareCount.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'

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
