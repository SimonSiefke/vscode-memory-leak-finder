import type { Session } from '../Session/Session.ts'
import * as CompareDomListeners from '../CompareDomListeners/CompareDomListeners.ts'
import * as GetDomListeners from '../GetDomListeners/GetDomListeners.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.DomListeners

export const targets = [TargetId.Browser]

export const create = (session: Session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session: Session, objectGroup: string) => {
  return GetDomListeners.getDomListeners(session, objectGroup)
}

export const stop = (session: Session, objectGroup: string) => {
  return GetDomListeners.getDomListeners(session, objectGroup)
}

export const compare = CompareDomListeners.compareDomListeners

export const isLeak = (result) => {
  return true
}
