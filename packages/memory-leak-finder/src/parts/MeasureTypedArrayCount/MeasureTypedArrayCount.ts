import type { Session } from '../Session/Session.ts'
import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetTypedArrayCount from '../GetTypedArrayCount/GetTypedArrayCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.TypedArrayCount

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session: Session, objectGroup: string) => {
  return GetTypedArrayCount.getTypedArrayCount(session, objectGroup)
}

export const stop = async (session: Session, objectGroup: string) => {
  return GetTypedArrayCount.getTypedArrayCount(session, objectGroup)
}

export const releaseResources = async (session: Session, objectGroup: string) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
