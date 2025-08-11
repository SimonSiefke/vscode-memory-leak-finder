import * as CompareNamedClosureCount from '../CompareNamedClosureCount/CompareNamedClosureCount.js'
import * as GetNamedClosureCount from '../GetNamedClosureCount/GetNamedClosureCount.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

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
