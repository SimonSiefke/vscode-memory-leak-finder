import * as CompareDetachedDomNodesWithStackTraces from '../CompareDetachedDomNodesWithStackTraces/CompareDetachedDomNodesWithStackTraces.js'
import * as GetDetachedDomNodes from '../GetDetachedDomNodes/GetDetachedDomNodes.js'
import * as GetDetachedDomNodesWithStackTraces from '../GetDetachedDomNodesWithStackTraces/GetDetachedDomNodesWithStackTraces.js'
import * as GetTotalInstanceCounts from '../GetTotalInstanceCounts/GetTotalInstanceCounts.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.js'
import * as StartTrackingDomNodeStackTraces from '../StartTrackingDomNodeStackTraces/StartTrackingDomNodeStackTraces.js'
import * as StopTrackingDomNodeStackTraces from '../StopTrackingDomNodeStackTraces/StopTrackingDomNodeStackTraces.js'

export const id = MeasureId.DetachedDomNodesWithStackTraces

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = async (session, objectGroup) => {
  await StartTrackingDomNodeStackTraces.startTrackingDomNodeStackTraces(session, objectGroup)
  return GetDetachedDomNodes.getDetachedDomNodes(session)
}

export const stop = async (session, objectGroup) => {
  const result = await GetDetachedDomNodesWithStackTraces.getDetachedDomNodesWithStackTraces(session, objectGroup)
  await StopTrackingDomNodeStackTraces.stopTrackingDomNodeStackTraces(session, objectGroup)
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
  return result
}

export const compare = CompareDetachedDomNodesWithStackTraces.compareDetachedDomNodesWithStackTraces

export const isLeak = ({ before, after }) => {
  return GetTotalInstanceCounts.getTotalInstanceCounts(after) > GetTotalInstanceCounts.getTotalInstanceCounts(before)
}

export const summary = ({ before, after }) => {
  return {
    before: GetTotalInstanceCounts.getTotalInstanceCounts(before),
    after: GetTotalInstanceCounts.getTotalInstanceCounts(after),
  }
}
