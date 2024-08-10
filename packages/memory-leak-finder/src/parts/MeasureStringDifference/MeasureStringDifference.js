import * as CompareCount from '../CompareCount/CompareCount.js'
import * as GetStrings from '../GetStrings/GetStrings.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as CompareStrings from '../CompareStrings/CompareStrings.js'

export const id = MeasureId.StringDifference

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetStrings.getStrings(session, objectGroup)
}

export const stop = (session, objectGroup) => {
  return GetStrings.getStrings(session, objectGroup)
}

export const compare = CompareStrings.compareStrings

export const isLeak = (newStrings) => {
  return newStrings.length > 0
}
