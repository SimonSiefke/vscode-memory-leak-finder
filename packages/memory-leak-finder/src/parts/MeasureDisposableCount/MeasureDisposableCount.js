import * as CompareCount from '../CompareCount/CompareCount.js'
import * as GetDisposableCount from '../GetDisposableCount/GetDisposableCount.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.js'

export const id = MeasureId.DisposableCount

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetDisposableCount.getDisposableCount(session, objectGroup)
}

export const stop = async (session, objectGroup) => {
  const result = await GetDisposableCount.getDisposableCount(session, objectGroup)
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
  return result
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
