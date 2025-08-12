import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetPendingPromiseCount from '../GetPendingPromiseCount/GetPendingPromiseCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'

export const id = MeasureId.PendingPromiseCount

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetPendingPromiseCount.getPendingPromiseCount(session, objectGroup)
}

export const stop = async (session, objectGroup) => {
  const result = await GetPendingPromiseCount.getPendingPromiseCount(session, objectGroup)
  return result
}

export const releaseResources = async (session, objectGroup) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
