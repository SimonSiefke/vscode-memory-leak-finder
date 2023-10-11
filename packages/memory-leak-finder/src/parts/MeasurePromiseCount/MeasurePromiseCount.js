import * as GetPromiseCount from '../GetPromiseCount/GetPromiseCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

export const id = MeasureId.PromiseCount

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetPromiseCount.getPromiseCount(session, objectGroup)
}

export const stop = (session, objectGroup) => {
  return GetPromiseCount.getPromiseCount(session, objectGroup)
}

export const compare = (before, after) => {
  return {
    before,
    after,
  }
}
