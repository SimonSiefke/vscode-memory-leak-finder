import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetProcessCount from '../GetProcessCount/GetProcessCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'

export const id = MeasureId.ProcessCount

export const targets: readonly any[] = []

export const create = ({ pid, processRootStrategy }: { pid: number; processRootStrategy: string }) => {
  return [pid, processRootStrategy]
}

export const start = async (pid: number, processRootStrategy: string): Promise<number> => {
  return await GetProcessCount.getProcessCount(pid, processRootStrategy)
}

export const stop = async (pid: number, processRootStrategy: string): Promise<number> => {
  return await GetProcessCount.getProcessCount(pid, processRootStrategy)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount