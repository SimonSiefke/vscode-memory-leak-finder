import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as TimeoutCount from '../TimeoutCount/TimeoutCount.js'

export const id = MeasureId.SetTimeout

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = async (session, objectGroup) => {
  await TimeoutCount.startTrackingTimeouts(session, objectGroup)
  return TimeoutCount.getTimeoutCount(session)
}

export const stop = async (session, objectGroup) => {
  await TimeoutCount.stopTrackingTimeouts(session, objectGroup)
  return TimeoutCount.getTimeoutCount(session)
}

export const compare = (before, after) => {
  return {
    before,
    after,
  }
}

export const isLeak = (result) => {
  return result.after > result.before
}
