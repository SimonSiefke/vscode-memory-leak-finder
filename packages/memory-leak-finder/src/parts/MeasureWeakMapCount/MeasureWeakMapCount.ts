import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetWeakMapCount from '../GetWeakMapCount/GetWeakMapCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'

export const id = MeasureId.WeakMapCount

export const create = (session) => {
  return [session]
}

export const start = async (session) => {
  const objectGroup = ObjectGroupId.create()
  const result = await GetWeakMapCount.getWeakMapCount(session, objectGroup)
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
  return result
}

export const stop = async (session) => {
  const objectGroup = await ObjectGroupId.create()
  const result = await GetWeakMapCount.getWeakMapCount(session, objectGroup)
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
  return result
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
