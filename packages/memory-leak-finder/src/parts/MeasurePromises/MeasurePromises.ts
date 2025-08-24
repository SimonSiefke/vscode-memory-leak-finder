import * as ComparePromises from '../ComparePromises/ComparePromises.ts'
import * as GetPromises from '../GetPromises/GetPromises.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'

export const id = MeasureId.Promises

export const targets = ['browser', 'node', 'webworker']

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

export const compare = ComparePromises.comparePromises

export const isLeak = (result) => {
  return result.after.length > result.before.length
}
