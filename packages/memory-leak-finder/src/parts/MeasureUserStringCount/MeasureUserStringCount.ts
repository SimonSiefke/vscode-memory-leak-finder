import * as CompareCount from '../CompareCount/CompareCount.js'
import * as GetUserStringCount from '../GetUserStringCount/GetUserStringCount.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

export const id = MeasureId.UserStringCount

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  const id = 0
  return GetUserStringCount.getUserStringCount(session, objectGroup, id)
}

export const stop = (session, objectGroup) => {
  const id = 1
  return GetUserStringCount.getUserStringCount(session, objectGroup, id)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
