import * as CompareEventTargetDifference from '../CompareEventTargetDifference/CompareEventTargetDifference.ts'
import * as GetEventTargets from '../GetEventTargets/GetEventTargets.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'

export const id = MeasureId.EventTargetDifference

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetEventTargets.getEventTargets(session, objectGroup, undefined)
}

export const stop = (session, objectGroup) => {
  return GetEventTargets.getEventTargets(session, objectGroup, undefined)
}

export const compare = CompareEventTargetDifference.compareEventTargets

export const isLeak = (leaked) => {
  return leaked.length > 0
}
