import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetUserStringCount from '../GetUserStringCount/GetUserStringCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'

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
