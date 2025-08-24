import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetTextDecoderCount from '../GetTextDecoderCount/GetTextDecoderCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'

export const id = MeasureId.TextDecoderCount

export const targets = ['browser', 'node', 'webworker']

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetTextDecoderCount.getTextDecoderCount(session, objectGroup)
}

export const stop = async (session, objectGroup) => {
  return GetTextDecoderCount.getTextDecoderCount(session, objectGroup)
}

export const releaseResources = async (session, objectGroup) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
