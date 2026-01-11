import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetFileWatcherCount from '../GetFileWatcherCount/GetFileWatcherCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'

export const id = MeasureId.FileWatcherCount

export const targets: readonly any[] = []

export const create = ({ pid }: { pid: number }) => {
  return [0, pid]
}

export const start = async (connectionId: number, pid: number): Promise<number> => {
  return await GetFileWatcherCount.getFileWatcherCount(pid)
}

export const stop = async (connectionId: number, pid: number): Promise<number> => {
  return await GetFileWatcherCount.getFileWatcherCount(pid)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
