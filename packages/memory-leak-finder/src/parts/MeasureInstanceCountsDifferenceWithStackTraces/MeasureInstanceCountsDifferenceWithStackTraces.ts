import * as CompareInstanceCountsDifference from '../CompareInstanceCountsDifference/CompareInstanceCountsDifference.ts'
import * as GetInstanceCounts from '../GetInstanceCounts/GetInstanceCounts.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as StartTrackingInstanceCounts from '../StartTrackingInstanceCounts/StartTrackingInstanceCounts.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import type { Session } from '../Session/Session.ts'

export const id = MeasureId.InstanceCountsDifferenceWithStackTraces

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = async (session: Session, objectGroup: string) => {
  await StartTrackingInstanceCounts.startTrackingInstanceCounts(session, objectGroup)
  return GetInstanceCounts.getInstanceCounts(session, objectGroup)
}

export const stop = (session: Session, objectGroup: string) => {
  return GetInstanceCounts.getInstanceCounts(session, objectGroup)
}

export const compare = CompareInstanceCountsDifference.compareInstanceCountsDifference
