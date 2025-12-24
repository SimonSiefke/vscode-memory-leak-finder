import type { Session } from '../Session/Session.ts'
import * as CompareNamedClosureCount from '../CompareNamedClosureCount/CompareNamedClosureCount.ts'
import * as GetNamedClosureCount from '../GetNamedClosureCount/GetNamedClosureCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.NamedClosureCount

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session: Session, objectGroup: string) => {
  const id = 0
  return GetNamedClosureCount.getNamedClosureCount(session, objectGroup, id)
}

export const stop = (session: Session, objectGroup: string) => {
  const id = 1
  return GetNamedClosureCount.getNamedClosureCount(session, objectGroup, id)
}

export const compare = CompareNamedClosureCount.compareNamedClosureCount

export const isLeak = IsLeakCount.isLeakCount
