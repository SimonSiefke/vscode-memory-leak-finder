import * as CompareInstanceCountsDifference from '../CompareInstanceCountsDifference/CompareInstanceCountsDifference.ts'
import * as GetInstanceCounts from '../GetInstanceCounts/GetInstanceCounts.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.InstanceCountsDifference

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetInstanceCounts.getInstanceCounts(session, objectGroup)
}

export const stop = async (session, objectGroup) => {
  const result = await GetInstanceCounts.getInstanceCounts(session, objectGroup)
  return result
}

export const releaseResources = async (session, objectGroup) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}

export const compare = CompareInstanceCountsDifference.compareInstanceCountsDifference

export const isLeak = (leaked) => {
  return leaked.length > 0
}
