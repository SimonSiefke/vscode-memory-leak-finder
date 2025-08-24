import * as CompareInstanceCountsDifference from '../CompareInstanceCountsDifference/CompareInstanceCountsDifference.ts'
import * as GetInstanceCounts from '../GetInstanceCounts/GetInstanceCounts.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as StartTrackingInstanceCounts from '../StartTrackingInstanceCounts/StartTrackingInstanceCounts.ts'

export const id = MeasureId.InstanceCountsDifferenceWithStackTraces

export const targets = ['browser', 'node', 'webworker']

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = async (session, objectGroup) => {
  await StartTrackingInstanceCounts.startTrackingInstanceCounts(session, objectGroup)
  return GetInstanceCounts.getInstanceCounts(session, objectGroup)
}

export const stop = (session, objectGroup) => {
  return GetInstanceCounts.getInstanceCounts(session, objectGroup)
}

export const compare = CompareInstanceCountsDifference.compareInstanceCountsDifference
