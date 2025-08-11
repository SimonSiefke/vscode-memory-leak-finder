import * as CompareNamedEmitterCount from '../CompareNamedEmitterCount/CompareNamedEmitterCount.js'
import * as GetNamedEmitterCount from '../GetNamedEmitterCount/GetNamedEmitterCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

export const id = MeasureId.NamedEmitterCount

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  const id = 0
  return GetNamedEmitterCount.getNamedEmitterCount(session, objectGroup, id)
}

export const stop = (session, objectGroup) => {
  const id = 1
  return GetNamedEmitterCount.getNamedEmitterCount(session, objectGroup, id)
}

export const compare = CompareNamedEmitterCount.compareNamedEmitterCount

export const isLeak = () => {
  return true
}
