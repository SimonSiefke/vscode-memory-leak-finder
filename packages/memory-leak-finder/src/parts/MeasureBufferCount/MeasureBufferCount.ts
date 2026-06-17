import type { Dynamic } from '../Types/Types.ts'
import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetBufferCount from '../GetBufferCount/GetBufferCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'
import * as TargetId from '../TargetId/TargetId.ts'
export const id = MeasureId.BufferCount
export const targets = [TargetId.Node]
export const create = (session: Dynamic) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}
export const start = (session: Dynamic, objectGroup: Dynamic) => {
  return GetBufferCount.getBufferCount(session, objectGroup)
}
export const stop = async (session: Dynamic, objectGroup: Dynamic) => {
  const result = await GetBufferCount.getBufferCount(session, objectGroup)
  return result
}
export const releaseResources = async (session: Dynamic, objectGroup: Dynamic) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}
export const compare = CompareCount.compareCount
export const isLeak = IsLeakCount.isLeakCount
