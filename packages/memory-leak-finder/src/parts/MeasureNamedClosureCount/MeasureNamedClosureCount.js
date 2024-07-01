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
  return GetNamedClosureCount.getNamedClosureCount(session, objectGroup)
}

export const stop = (session, objectGroup) => {
  return GetNamedClosureCount.getNamedClosureCount(session, objectGroup)
}

export const compare = CompareNamedClosureCount.compareNamedClosureCount

export const isLeak = IsLeakCount.isLeakCount
