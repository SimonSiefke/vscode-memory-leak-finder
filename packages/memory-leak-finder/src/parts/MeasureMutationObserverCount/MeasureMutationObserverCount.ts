import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetMutationObserverCount from '../GetMutationObserverCount/GetMutationObserverCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'
import type { Session } from '../Session/Session.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.MutationObserverCount

export const targets = [TargetId.Browser]

export const create = (session: Session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session: Session, objectGroup: string) => {
  return GetMutationObserverCount.getMutationObserverCount(session, objectGroup)
}

export const stop = async (session: Session, objectGroup: string) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
  return GetMutationObserverCount.getMutationObserverCount(session, objectGroup)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
