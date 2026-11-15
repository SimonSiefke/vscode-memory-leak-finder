import type { Session } from '../Session/Session.ts'
import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetEmptyMapCount from '../GetEmptyMapCount/GetEmptyMapCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.EmptyMapCount
export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]
export const create = (session: Session) => [session] as const
export const start = GetEmptyMapCount.getEmptyMapCount
export const stop = GetEmptyMapCount.getEmptyMapCount
export const compare = CompareCount.compareCount
export const isLeak = IsLeakCount.isLeakCount
