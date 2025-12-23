import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetGpuCanvasContextCount from '../GetWebGpuCanvasContextCount/GetWebGpuCanvasContextCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import type { Session } from '../Session/Session.ts'

export const id = MeasureId.GPUCanvasContextCount

export const targets = [TargetId.Browser]

export const create = (session: Session) => {
  return [session]
}

export const start = (session: Session) => {
  return GetGpuCanvasContextCount.getWebGpuCanvasContextCount(session)
}

export const stop = (session: Session) => {
  return GetGpuCanvasContextCount.getWebGpuCanvasContextCount(session)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
