import * as GetIpcMessages from '../GetIpcMessages/GetIpcMessages.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'
import type { Session } from '../Session/Session.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import * as CompareIpcMessages from '../CompareIpcMessages/CompareIpcMessages.ts'

export const id = MeasureId.IpcMessageCount

export const targets = [TargetId.Node]

export const create = (session: Session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = async (session: Session, objectGroup: string) => {
  return await GetIpcMessages.getIpcMessages(session)
}

export const stop = async (session: Session, objectGroup: string) => {
  return await GetIpcMessages.getIpcMessages(session)
}

export const releaseResources = async (session: Session, objectGroup: string) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}

export const compare = CompareIpcMessages.compare

export const isLeak = IsLeakCount.isLeakCount
