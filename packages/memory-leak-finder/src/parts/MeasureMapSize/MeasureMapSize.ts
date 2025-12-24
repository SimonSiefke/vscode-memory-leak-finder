import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetMapSize from '../GetMapSize/GetMapSize.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import type { Session } from '../Session/Session.ts'

export const id = MeasureId.MapSize

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session: Session, objectGroup: string) => {
  return GetMapSize.getMapSize(session)
}

export const stop = (session: Session, objectGroup: string) => {
  return GetMapSize.getMapSize(session)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
