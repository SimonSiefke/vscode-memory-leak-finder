import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetPromiseCount from '../GetPromiseCount/GetPromiseCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'

export const id = MeasureId.PromiseCount

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = async (session, objectGroup) => {
  const result = await GetPromiseCount.getPromiseCount(session, objectGroup)
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
  return result
}

export const stop = async (session, objectGroup) => {
  const result = await GetPromiseCount.getPromiseCount(session, objectGroup)
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
  return result
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
