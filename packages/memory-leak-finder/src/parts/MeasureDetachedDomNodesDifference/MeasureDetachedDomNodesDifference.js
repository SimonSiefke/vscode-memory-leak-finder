import * as CompareDetachedDomNodesDifference from '../CompareDetachedDomNodesDifference/CompareDetachedDomNodesDifference.js'
import * as GetDetachedDomNodes from '../GetDetachedDomNodes/GetDetachedDomNodes.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.js'

export const id = MeasureId.DetachedDomNodesDifference

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetDetachedDomNodes.getDetachedDomNodes(session, objectGroup)
}

export const stop = async (session, objectGroup) => {
  const result = await GetDetachedDomNodes.getDetachedDomNodes(session, objectGroup)
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
  return result
}

export const compare = CompareDetachedDomNodesDifference.compareDetachedDomNodesDifference

export const isLeak = (leaked) => {
  return leaked.length > 0
}
