import * as GetPromises from '../GetPromises/GetPromises.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

export const id = MeasureId.Promises

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetPromises.getPromises(session, objectGroup)
}

export const stop = (session, objectGroup) => {
  return GetPromises.getPromises(session, objectGroup)
}

export const compare = (before, after) => {
  return { before, after }
}

export const isLeak = (result) => {
  return result.after.length > result.before.length
}
