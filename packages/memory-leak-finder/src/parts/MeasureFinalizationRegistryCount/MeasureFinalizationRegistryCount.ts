import type { Session } from '../Session/Session.ts'
import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetFinalizationRegistryCount from '../GetFinalizationRegistryCount/GetFinalizationRegistryCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.FinalizationRegistryCount

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  return [session]
}

export const start = (session: Session) => {
  return GetFinalizationRegistryCount.getFinalizationRegistryCount(session)
}

export const stop = (session: Session) => {
  return GetFinalizationRegistryCount.getFinalizationRegistryCount(session)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
