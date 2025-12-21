import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetEmitterCount from '../GetEmitterCount/GetEmitterCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import type { Session } from '../Session/Session.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.EmitterCount

export const targets = [TargetId.Node]

export const create = (session: Session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session: Session, objectGroup: string) => {
  return GetEmitterCount.getEmitterCount(session, objectGroup)
}

export const stop = (session: Session, objectGroup: string) => {
  return GetEmitterCount.getEmitterCount(session, objectGroup)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
