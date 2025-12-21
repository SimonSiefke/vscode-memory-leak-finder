import * as CompareStrings from '../CompareStrings/CompareStrings.ts'
import * as GetStrings from '../GetStrings/GetStrings.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.StringDifference

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  const id = 0
  return GetStrings.getStrings(session, objectGroup, id)
}

export const stop = (session, objectGroup) => {
  const id = 1
  return GetStrings.getStrings(session, objectGroup, id)
}

export const compare = CompareStrings.compareStrings

export const isLeak = (newStrings) => {
  return newStrings.length > 0
}
