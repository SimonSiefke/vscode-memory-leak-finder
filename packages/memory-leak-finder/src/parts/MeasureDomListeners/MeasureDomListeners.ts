import * as CompareDomListeners from '../CompareDomListeners/CompareDomListeners.ts'
import * as GetDomListeners from '../GetDomListeners/GetDomListeners.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'

export const id = MeasureId.DomListeners

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

export const compare = CompareDomListeners.compareDomListeners

export const isLeak = (result) => {
  return true
}
