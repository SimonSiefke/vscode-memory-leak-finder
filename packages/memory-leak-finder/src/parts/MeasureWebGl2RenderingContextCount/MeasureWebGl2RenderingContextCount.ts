import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetWebgl2RenderingContextCount from '../GetWebgl2RenderingContextCount/GetWebgl2RenderingContextCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.Webgl2RenderinngContextCount

export const targets = [TargetId.Browser]

export const create = (session) => {
  return [session]
}

export const start = (session) => {
  return GetWebgl2RenderingContextCount.getWebgl2RenderingContextCount(session, undefined)
}

export const stop = (session) => {
  return GetWebgl2RenderingContextCount.getWebgl2RenderingContextCount(session, undefined)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
