import * as GetDomCounters from '../GetDomCounters/GetDomCounters.ts'
import * as IsLeakDomCounters from '../IsLeakDomCounters/IsLeakDomCounters.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.DomCounters

export const targets = [TargetId.Browser]

export const create = (session) => {
  return [session]
}

export const start = (session) => {
  return GetDomCounters.getDomCounters(session)
}

export const stop = (session) => {
  return GetDomCounters.getDomCounters(session)
}

export const compare = (before, after) => {
  return {
    before,
    after,
  }
}

export const isLeak = IsLeakDomCounters.isLeakDomCounters

export const summary = ({ before, after }) => {
  const documentsBefore = before.documents
  const nodesBefore = before.nodes
  const eventListenersBefore = before.jsEventListeners
  const documentsAfter = after.documents
  const nodesAfter = after.nodes
  const eventListenersAfter = after.jsEventListeners
  return {
    documentsBefore,
    documentsAfter,
    nodesBefore,
    nodesAfter,
    eventListenersBefore,
    eventListenersAfter,
  }
}
