import * as GetNamedEmitterCount from '../GetNamedEmitterCount/GetNamedEmitterCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

export const id = MeasureId.NamedEmitterCount

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetNamedEmitterCount.getNamedEmitterCount(session, objectGroup)
}

export const stop = (session, objectGroup) => {
  return GetNamedEmitterCount.getNamedEmitterCount(session, objectGroup)
}

export const compare = (before, after) => {
  return {
    before,
    after,
  }
}

export const isLeak = () => {
  return true
}
