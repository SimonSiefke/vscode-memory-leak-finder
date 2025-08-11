import * as CompareCount from '../CompareCount/CompareCount.js'
import * as GetObjectShapeCount from '../GetObjectShapeCount/GetObjectShapeCount.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.js'

export const id = MeasureId.ObjectShapeCount

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  const id = 0
  return GetObjectShapeCount.getObjectShapeCount(session, objectGroup, id)
}

export const stop = async (session, objectGroup) => {
  const id = 1
  const result = await GetObjectShapeCount.getObjectShapeCount(session, objectGroup, id)
  return result
}

export const releaseResources = async (session, objectGroup) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
