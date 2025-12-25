import type { Session } from '../Session/Session.ts'
import * as CompareDetachedDomNodes from '../CompareDetachedDomNodes/CompareDetachedDomNodes.ts'
import * as GetDetachedDomNodes from '../GetDetachedDomNodes/GetDetachedDomNodes.ts'
import * as GetTotalInstanceCounts from '../GetTotalInstanceCounts/GetTotalInstanceCounts.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.DetachedDomNodes

export const targets = [TargetId.Browser]

export const create = (session: Session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session: Session, objectGroup: string) => {
  return GetDetachedDomNodes.getDetachedDomNodes(session, objectGroup)
}

export const stop = async (session: Session, objectGroup: string) => {
  const result = await GetDetachedDomNodes.getDetachedDomNodes(session, objectGroup)
  return result
}

export const releaseResources = async (session: Session, objectGroup: string) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}

export const compare = CompareDetachedDomNodes.compareDetachedDomNodes

export const isLeak = ({ after, before }) => {
  return GetTotalInstanceCounts.getTotalInstanceCounts(after) > GetTotalInstanceCounts.getTotalInstanceCounts(before)
}

export const summary = ({ after, before }) => {
  return {
    after: GetTotalInstanceCounts.getTotalInstanceCounts(after),
    before: GetTotalInstanceCounts.getTotalInstanceCounts(before),
  }
}
