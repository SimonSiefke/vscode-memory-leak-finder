import * as CompareDetachedDomNodes from '../CompareDetachedDomNodes/CompareDetachedDomNodes.js'
import * as GetDetachedDomNodes from '../GetDetachedDomNodes/GetDetachedDomNodes.js'
import * as GetTotalInstanceCounts from '../GetTotalInstanceCounts/GetTotalInstanceCounts.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.js'

export const id = MeasureId.DetachedDomNodes

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

export const compare = CompareDetachedDomNodes.compareDetachedDomNodes

export const isLeak = ({ before, after }) => {
  return GetTotalInstanceCounts.getTotalInstanceCounts(after) > GetTotalInstanceCounts.getTotalInstanceCounts(before)
}

export const summary = ({ before, after }) => {
  return {
    before: GetTotalInstanceCounts.getTotalInstanceCounts(before),
    after: GetTotalInstanceCounts.getTotalInstanceCounts(after),
  }
}
