import type { Session } from '../Session/Session.ts'
import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetActiveIntervalCount from '../GetActiveIntervalCount/GetActiveIntervalCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.ActiveIntervalCount
export const targets = [TargetId.Browser]
export const create = (session: Session) => [session] as const
export const start = GetActiveIntervalCount.getActiveIntervalCount
export const stop = GetActiveIntervalCount.getActiveIntervalCount
export const compare = CompareCount.compareCount
export const isLeak = IsLeakCount.isLeakCount
