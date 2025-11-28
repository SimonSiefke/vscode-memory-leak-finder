import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetCanvasRenderingContext2dCount from '../GetCanvasRenderingContext2dCount/GetCanvasRenderingContext2dCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.CanvasRenderingContext2dCount

export const targets = [TargetId.Browser]

export const create = (session) => {
  return [session]
}

export const start = (session) => {
  return GetCanvasRenderingContext2dCount.getCanvasRenderingContext2dCount(session, undefined)
}

export const stop = (session) => {
  return GetCanvasRenderingContext2dCount.getCanvasRenderingContext2dCount(session, undefined)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
