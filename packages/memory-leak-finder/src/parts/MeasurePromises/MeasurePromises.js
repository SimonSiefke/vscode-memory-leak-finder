import * as GetPromises from '../GetPromises/GetPromises.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

export const id = MeasureId.Promises

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetPromises.getPromises(session)
}

export const stop = (session, objectGroup) => {
  return GetPromises.getPromises(session)
}

export const compare = (before, after) => {
  return { before, after }
}
