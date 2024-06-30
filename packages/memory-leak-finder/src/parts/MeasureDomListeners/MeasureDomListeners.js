import * as GetDomListeners from '../GetDomListeners/GetDomListeners.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

export const id = MeasureId.Promises

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetDomListeners.getDomListeners(session, objectGroup)
}

export const stop = (session, objectGroup) => {
  return GetDomListeners.getDomListeners(session, objectGroup)
}

export const compare = (before, after) => {
  return { before, after }
}

export const isLeak = (result) => {
  return true
}
