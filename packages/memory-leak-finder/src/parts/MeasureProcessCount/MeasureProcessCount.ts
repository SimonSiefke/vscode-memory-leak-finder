import type { Dynamic } from '../Types/Types.ts'
import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetProcessCount from '../GetProcessCount/GetProcessCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
export const id = MeasureId.ProcessCount
export const targets: readonly Dynamic[] = []
export const create = ({ pid }: { pid: number }) => {
  return [pid]
}
export const start = async (pid: number): Promise<number> => {
  return GetProcessCount.getProcessCount(pid)
}
export const stop = async (pid: number): Promise<number> => {
  return GetProcessCount.getProcessCount(pid)
}
export const compare = CompareCount.compareCount
export const isLeak = IsLeakCount.isLeakCount
