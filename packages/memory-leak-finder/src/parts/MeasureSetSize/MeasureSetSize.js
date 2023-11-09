import * as CompareCount from '../CompareCount/CompareCount.js'
import * as GetSetSize from '../GetSetSize/GetSetSize.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

export const id = MeasureId.SetSize

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetSetSize.getSetSize(session)
}

export const stop = (session, objectGroup) => {
  return GetSetSize.getSetSize(session)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
