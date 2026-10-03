import type { Session } from '../Session/Session.ts'
import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetTrackedTimeoutCount from '../GetTrackedTimeoutCount/GetTrackedTimeoutCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.TrackedTimeouts

export const targets = [TargetId.Browser]

export const create = (session: Session) => {
  return [session]
}

export const start = (session: Session) => {
  return GetTrackedTimeoutCount.getTrackedTimeoutCount(session)
}

export const stop = (session: Session) => {
  return GetTrackedTimeoutCount.getTrackedTimeoutCount(session)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
