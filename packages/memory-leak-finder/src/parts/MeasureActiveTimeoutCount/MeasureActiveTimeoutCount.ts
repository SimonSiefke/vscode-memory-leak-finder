import type { Session } from '../Session/Session.ts'
import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetActiveTimeoutCount from '../GetActiveTimeoutCount/GetActiveTimeoutCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.ActiveTimeoutCount
export const targets = [TargetId.Browser]
export const create = (session: Session) => [session] as const
export const start = GetActiveTimeoutCount.getActiveTimeoutCount
export const stop = GetActiveTimeoutCount.getActiveTimeoutCount
export const compare = CompareCount.compareCount
export const isLeak = IsLeakCount.isLeakCount
