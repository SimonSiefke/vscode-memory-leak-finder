import * as CompareCount from '../CompareCount/CompareCount.js'
import * as GetStyleElementCount from '../GetStyleElementCount/GetStyleElementCount.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.js'

export const id = MeasureId.StyleElementCount

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetStyleElementCount.getCanvasCount(session, objectGroup)
}

export const stop = async (session, objectGroup) => {
  const result = await GetStyleElementCount.getCanvasCount(session, objectGroup)
  return result
}

export const releaseResources = async (session, objectGroup) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
