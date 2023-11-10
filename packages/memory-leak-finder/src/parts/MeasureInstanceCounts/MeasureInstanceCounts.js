import * as GetInstanceCounts from '../GetInstanceCounts/GetInstanceCounts.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

export const id = MeasureId.PromiseCount

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetInstanceCounts.getInstanceCounts(session)
}

export const stop = (session, objectGroup) => {
  return GetInstanceCounts.getInstanceCounts(session)
}

export const compare = (before, after) => {
  return { before, after }
}
