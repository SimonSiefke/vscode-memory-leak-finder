import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetOffscreenCanvasCount from '../GetOffscreenCanvasCount/GetOffscreenCanvasCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'

export const id = MeasureId.OffscreenCanvasCount

export const targets = ['browser', 'webworker']

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetOffscreenCanvasCount.getOffscreenCanvasCount(session, objectGroup)
}

export const stop = async (session, objectGroup) => {
  const result = await GetOffscreenCanvasCount.getOffscreenCanvasCount(session, objectGroup)
  return result
}

export const releaseResources = async (session, objectGroup) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
