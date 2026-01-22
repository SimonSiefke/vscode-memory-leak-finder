import type { Session } from '../Session/Session.ts'
import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetIpcMessageCount from '../GetIpcMessageCount/GetIpcMessageCount.ts'
import * as GetIpcMessages from '../GetIpcMessages/GetIpcMessages.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.IpcMessageCount

export const targets = [TargetId.Browser, TargetId.Worker, TargetId.Node]

export const create = (session: Session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = async (session: Session, objectGroup: string) => {
  // Write IPC messages to file
  await GetIpcMessages.getIpcMessages(session)
  return GetIpcMessageCount.getIpcMessageCount(session, objectGroup)
}

export const stop = async (session: Session, objectGroup: string) => {
  // Write IPC messages to file
  await GetIpcMessages.getIpcMessages(session)
  const result = await GetIpcMessageCount.getIpcMessageCount(session, objectGroup)
  return result
}

export const releaseResources = async (session: Session, objectGroup: string) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
