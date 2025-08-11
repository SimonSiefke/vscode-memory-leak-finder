import * as CompareCount from '../CompareCount/CompareCount.js'
import * as GetIframeCount from '../GetIframeCount/GetIframeCount.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

export const id = MeasureId.IframeCount

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetIframeCount.getIframeCount(session)
}

export const stop = (session, objectGroup) => {
  return GetIframeCount.getIframeCount(session)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
