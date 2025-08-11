import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetTextEncoderCount from '../GetTextEncoderCount/GetTextEncoderCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'

export const id = MeasureId.TextEncoderCount

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetTextEncoderCount.getTextEncoderCount(session, objectGroup)
}

export const stop = async (session, objectGroup) => {
  return GetTextEncoderCount.getTextEncoderCount(session, objectGroup)
}

export const releaseResources = async (session, objectGroup) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
