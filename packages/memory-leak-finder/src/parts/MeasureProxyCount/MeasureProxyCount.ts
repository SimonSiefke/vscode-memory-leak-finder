import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetProxyCount from '../GetProxyCount/GetProxyCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.ProxyCount

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session) => {
  return [session]
}

export const start = (session) => {
  return GetProxyCount.getProxyCount(session, undefined)
}

export const stop = (session) => {
  return GetProxyCount.getProxyCount(session, undefined)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
