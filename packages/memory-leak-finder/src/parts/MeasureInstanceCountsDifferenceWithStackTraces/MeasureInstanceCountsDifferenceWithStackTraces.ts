import * as CompareInstanceCountsDifference from '../CompareInstanceCountsDifference/CompareInstanceCountsDifference.js'
import * as GetInstanceCounts from '../GetInstanceCounts/GetInstanceCounts.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as StartTrackingInstanceCounts from '../StartTrackingInstanceCounts/StartTrackingInstanceCounts.js'

export const id = MeasureId.InstanceCountsDifferenceWithStackTraces

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
