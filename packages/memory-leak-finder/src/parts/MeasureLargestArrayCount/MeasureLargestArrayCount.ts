import * as CompareLargestArrayCount from '../CompareLargestArrayCount/CompareLargestArrayCount.ts'
import * as GetLargestArrayCount from '../GetLargestArrayCount/GetLargestArrayCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'

export const id = MeasureId.LargestArrayCount

export const targets = ['browser', 'node', 'webworker']

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = async (session, objectGroup) => {
  const id = 0
  return GetLargestArrayCount.getLargestArrayCount(session, objectGroup, id)
}

export const stop = async (session, objectGroup) => {
  const id = 1
  return GetLargestArrayCount.getLargestArrayCount(session, objectGroup, id)
}

export const compare = CompareLargestArrayCount.compareLargestArrayCount

export const isLeak = (leaked) => {
  return true
}
