import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetFileWatcherCount from '../GetFileWatcherCount/GetFileWatcherCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'

export const id = MeasureId.FileWatcherCount

export const targets: readonly any[] = []

export const create = (connectionId: number) => {
  return [connectionId]
}

export const start = async (connectionId: number): Promise<number> => {
  const state = MemoryLeakFinderState.get(connectionId)
  const pid = state?.pid
  return await GetFileWatcherCount.getFileWatcherCount(pid)
}

export const stop = async (connectionId: number): Promise<number> => {
  const state = MemoryLeakFinderState.get(connectionId)
  const pid = state?.pid
  return await GetFileWatcherCount.getFileWatcherCount(pid)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
