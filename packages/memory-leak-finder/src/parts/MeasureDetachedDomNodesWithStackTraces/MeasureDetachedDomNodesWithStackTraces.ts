import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'
import type { Session } from '../Session/Session.ts'
import * as CompareDetachedDomNodesWithStackTraces from '../CompareDetachedDomNodesWithStackTraces/CompareDetachedDomNodesWithStackTraces.ts'
import * as GetDetachedDomNodesWithStackTraces from '../GetDetachedDomNodesWithStackTraces/GetDetachedDomNodesWithStackTraces.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as StartTrackingDomNodeStackTraces from '../StartTrackingDomNodeStackTraces/StartTrackingDomNodeStackTraces.ts'
import * as StopTrackingDomNodeStackTraces from '../StopTrackingDomNodeStackTraces/StopTrackingDomNodeStackTraces.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.DetachedDomNodesWithStackTraces

export const targets = [TargetId.Browser]

export const create = (session: Session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler]
}

export const start = async (session: Session, objectGroup: string, scriptHandler: IScriptHandler) => {
  await scriptHandler.start(session)
  await StartTrackingDomNodeStackTraces.startTrackingDomNodeStackTraces(session, objectGroup)
  return GetDetachedDomNodesWithStackTraces.getDetachedDomNodesWithStackTraces(session, objectGroup, scriptHandler.scriptMap)
}

export const stop = async (session: Session, objectGroup: string, scriptHandler: IScriptHandler) => {
  await scriptHandler.stop(session)
  const result = await GetDetachedDomNodesWithStackTraces.getDetachedDomNodesWithStackTraces(session, objectGroup, scriptHandler.scriptMap)
  await StopTrackingDomNodeStackTraces.stopTrackingDomNodeStackTraces(session, objectGroup)
  return result
}

export const releaseResources = async (session: Session, objectGroup: string) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}

export const compare = CompareDetachedDomNodesWithStackTraces.compareDetachedDomNodesWithStackTraces

export const isLeak = ({ after }) => {
  if (!after || !Array.isArray(after)) {
    return false
  }
  return after.length > 0
}

export const summary = ({ after }) => {
  if (!after || !Array.isArray(after)) {
    return {
      after: 0,
      before: 0,
    }
  }
  const totalDelta = after.reduce((sum, node) => sum + (node.delta || 0), 0)
  return {
    after: totalDelta,
    before: 0,
  }
}
