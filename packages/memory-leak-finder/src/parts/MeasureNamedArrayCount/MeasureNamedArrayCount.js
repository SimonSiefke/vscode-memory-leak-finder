import * as GetNamedArrayCount from '../GetNamedArrayCount/GetNamedArrayCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

export const id = MeasureId.NamedArrayCount

const maxItems = 1_000_000

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = async (session, objectGroup) => {
  return GetNamedArrayCount.getNamedArrayCount(session, objectGroup, maxItems)
}

export const stop = async (session, objectGroup) => {
  return GetNamedArrayCount.getNamedArrayCount(session, objectGroup, maxItems)
}

export const compare = (before, after) => {
  return {
    before,
    after,
  }
}

export const isLeak = (leaked) => {
  return true
}
