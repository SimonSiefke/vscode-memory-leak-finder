import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

export const id = MeasureId.InstanceCounts

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = async (session, objectGroup) => {
  return 0
}

export const stop = async (session, objectGroup) => {
  return 0
}

export const compare = (before, after) => {
  return { before, after }
}

export const isLeak = ({ before, after }) => {
  return after > before
}
