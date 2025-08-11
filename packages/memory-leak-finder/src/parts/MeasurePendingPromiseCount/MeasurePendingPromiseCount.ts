import * as CompareCount from '../CompareCount/CompareCount.js'
import * as GetPendingPromiseCount from '../GetPendingPromiseCount/GetPendingPromiseCount.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.js'

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
