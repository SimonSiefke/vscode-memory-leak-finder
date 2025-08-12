import * as CompareNamedClosureCount from '../CompareNamedClosureCount/CompareNamedClosureCount.ts'
import * as GetNamedClosureCount from '../GetNamedClosureCount/GetNamedClosureCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'

export const id = MeasureId.NamedClosureCount

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  const id = 0
  return GetNamedClosureCount.getNamedClosureCount(session, objectGroup, id)
}

export const stop = (session, objectGroup) => {
  const id = 1
  return GetNamedClosureCount.getNamedClosureCount(session, objectGroup, id)
}

export const compare = CompareNamedClosureCount.compareNamedClosureCount

export const isLeak = IsLeakCount.isLeakCount
