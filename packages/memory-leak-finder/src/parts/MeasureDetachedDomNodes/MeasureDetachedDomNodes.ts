import * as CompareDetachedDomNodes from '../CompareDetachedDomNodes/CompareDetachedDomNodes.ts'
import * as GetDetachedDomNodes from '../GetDetachedDomNodes/GetDetachedDomNodes.ts'
import * as GetTotalInstanceCounts from '../GetTotalInstanceCounts/GetTotalInstanceCounts.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'

export const id = MeasureId.DetachedDomNodes

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
