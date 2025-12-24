import * as GetArrayElementCount from '../GetArrayElementCount/GetArrayElementCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import type { Session } from '../Session/Session.ts'

export const id = MeasureId.ArrayElementCount

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session: Session, objectGroup: string) => {
  return GetArrayElementCount.getArrayElementCount(session, objectGroup)
}

export const stop = async (session: Session, objectGroup: string) => {
  const result = await GetArrayElementCount.getArrayElementCount(session, objectGroup)
  return result
}

export const releaseResources = async (session: Session, objectGroup: string) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}

export const compare = (before, after) => {
  return {
    after,
    before,
  }
}

export const isLeak = ({ after, before }) => {
  return after > before
}
