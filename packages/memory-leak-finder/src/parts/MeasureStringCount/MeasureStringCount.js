import * as CompareCount from '../CompareCount/CompareCount.js'
import * as GetStringCount from '../GetStringCount/GetStringCount.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

export const id = MeasureId.StringCount

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  const id = 0
  return GetStringCount.getStringCount(session, objectGroup, id)
}

export const stop = (session, objectGroup) => {
  const id = 1
  return GetStringCount.getStringCount(session, objectGroup, id)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
