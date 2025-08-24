import * as CompareDetachedDomNodesDifference from '../CompareDetachedDomNodesDifference/CompareDetachedDomNodesDifference.ts'
import * as GetDetachedDomNodes from '../GetDetachedDomNodes/GetDetachedDomNodes.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'

export const id = MeasureId.DetachedDomNodesDifference

export const targets = ['browser']

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetDetachedDomNodes.getDetachedDomNodes(session, objectGroup)
}

export const stop = async (session, objectGroup) => {
  const result = await GetDetachedDomNodes.getDetachedDomNodes(session, objectGroup)
  return result
}

export const releaseResources = async (session, objectGroup) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}

export const compare = CompareDetachedDomNodesDifference.compareDetachedDomNodesDifference

export const isLeak = (leaked) => {
  return leaked.length > 0
}
