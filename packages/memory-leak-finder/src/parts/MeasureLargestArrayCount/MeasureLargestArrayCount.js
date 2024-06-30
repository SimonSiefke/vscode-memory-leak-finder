import * as CompareLargestArrayCount from '../CompareLargestArrayCount/CompareLargestArrayCount.js'
import * as GetLargestArrayCount from '../GetLargestArrayCount/GetLargestArrayCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

export const id = MeasureId.LargestArrayCount

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = async (session, objectGroup) => {
  return GetLargestArrayCount.getLargestArrayCount(session, objectGroup)
}

export const stop = async (session, objectGroup) => {
  return GetLargestArrayCount.getLargestArrayCount(session, objectGroup)
}

export const compare = CompareLargestArrayCount.compareLargestArrayCount

export const isLeak = (leaked) => {
  return true
}
