import * as GetNamedArrayCount from '../GetNamedArrayCount/GetNamedArrayCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as CompareNamedArrayCountDifference from '../CompareNamedArrayCountDifference/CompareNamedArrayCountDifference.ts'

export const id = MeasureId.NamedArrayCountDifference

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = async (session, objectGroup) => {
  return GetNamedArrayCount.getNamedArrayCount(session, objectGroup, 0 as any)
}

export const stop = async (session, objectGroup) => {
  return GetNamedArrayCount.getNamedArrayCount(session, objectGroup, 1 as any)
}

export const compare = CompareNamedArrayCountDifference.compareNamedArrayCountDifference

export const isLeak = (leaked) => {
  return leaked.length > 0
}
