import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetProxyCount from '../GetProxyCount/GetProxyCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import type { Session } from '../Session/Session.ts'

export const id = MeasureId.ProxyCount

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  return [session]
}

export const start = (session: Session) => {
  return GetProxyCount.getProxyCount(session)
}

export const stop = (session: Session) => {
  return GetProxyCount.getProxyCount(session)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
