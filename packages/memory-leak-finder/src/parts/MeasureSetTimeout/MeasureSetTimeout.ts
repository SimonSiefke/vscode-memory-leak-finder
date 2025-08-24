import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as TimeoutCount from '../TimeoutCount/TimeoutCount.ts'

export const id = MeasureId.SetTimeout

export const targets = ['browser', 'node', 'webworker']

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
