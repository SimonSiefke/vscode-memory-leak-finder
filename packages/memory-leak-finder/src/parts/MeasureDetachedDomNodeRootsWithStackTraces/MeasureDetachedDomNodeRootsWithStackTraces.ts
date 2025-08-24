import * as CompareDetachedDomNodesWithStackTraces from '../CompareDetachedDomNodesWithStackTraces/CompareDetachedDomNodesWithStackTraces.ts'
import * as GetDetachedDomNodesWithStackTraces from '../GetDetachedDomNodesWithStackTraces/GetDetachedDomNodesWithStackTraces.ts'
import * as GetTotalInstanceCounts from '../GetTotalInstanceCounts/GetTotalInstanceCounts.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as StartTrackingDomNodeStackTraces from '../StartTrackingDomNodeStackTraces/StartTrackingDomNodeStackTraces.ts'
import * as StopTrackingDomNodeStackTraces from '../StopTrackingDomNodeStackTraces/StopTrackingDomNodeStackTraces.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.DetachedDomNodeRootsWithStackTraces

export const targets = [TargetId.Browser]

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler]
}

export const start = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.start(session)
  await StartTrackingDomNodeStackTraces.startTrackingDomNodeStackTraces(session, objectGroup)
  return GetDetachedDomNodesWithStackTraces.getDetachedDomNodesWithStackTraces(session, objectGroup, scriptHandler.scriptMap)
}

export const stop = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.stop(session)
  const result = await GetDetachedDomNodesWithStackTraces.getDetachedDomNodesWithStackTraces(session, objectGroup, scriptHandler.scriptMap)
  await StopTrackingDomNodeStackTraces.stopTrackingDomNodeStackTraces(session, objectGroup)
  return result
}

export const releaseResources = async (session, objectGroup) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
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
