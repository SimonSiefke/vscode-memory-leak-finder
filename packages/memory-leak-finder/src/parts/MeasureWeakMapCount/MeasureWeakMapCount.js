import * as CompareCount from '../CompareCount/CompareCount.js'
import * as GetWeakMapCount from '../GetWeakMapCount/GetWeakMapCount.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.js'

export const id = MeasureId.WeakMapCount

export const create = (session) => {
  return [session]
}

export const start = async (session) => {
  const objectGroup = ObjectGroupId.create()
  const result = await GetWeakMapCount.getWeakMapCount(session, objectGroup)
  await ReleaseObjectGroup.releaseObjectGroup(objectGroup)
  return result
}

export const stop = async (session) => {
  const objectGroup = await ObjectGroupId.create()
  const result = await GetWeakMapCount.getWeakMapCount(session, objectGroup)
  await ReleaseObjectGroup.releaseObjectGroup(objectGroup)
  return result
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
