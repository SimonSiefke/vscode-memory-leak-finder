import type { Session } from '../Session/Session.ts'
import * as GetDomCounters from '../GetDomCounters/GetDomCounters.ts'
import * as IsLeakDomCounters from '../IsLeakDomCounters/IsLeakDomCounters.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.DomCounters

export const targets = [TargetId.Browser]

export const create = (session: Session) => {
  return [session]
}

export const start = (session: Session) => {
  return GetDomCounters.getDomCounters(session)
}

export const stop = (session: Session) => {
  return GetDomCounters.getDomCounters(session)
}

export const compare = (before, after) => {
  return {
    after,
    before,
  }
}

export const isLeak = IsLeakDomCounters.isLeakDomCounters

export const summary = ({ after, before }) => {
  const documentsBefore = before.documents
  const nodesBefore = before.nodes
  const eventListenersBefore = before.jsEventListeners
  const documentsAfter = after.documents
  const nodesAfter = after.nodes
  const eventListenersAfter = after.jsEventListeners
  return {
    documentsAfter,
    documentsBefore,
    eventListenersAfter,
    eventListenersBefore,
    nodesAfter,
    nodesBefore,
  }
}
