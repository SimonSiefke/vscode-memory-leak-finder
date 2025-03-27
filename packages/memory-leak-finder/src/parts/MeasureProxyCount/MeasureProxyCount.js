import * as CompareCount from '../CompareCount/CompareCount.js'
import * as GetProxyCount from '../GetProxyCount/GetProxyCount.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'

export const id = MeasureId.ProxyCount

export const create = (session) => {
  return [session]
}

export const start = (session) => {
  return GetProxyCount.getProxyCount(session)
}

export const stop = (session) => {
  return GetProxyCount.getProxyCount(session)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
