import type { ProcessInfo } from '../GetFileDescriptorCount/GetFileDescriptorCount.ts'
import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetFileDescriptorCount from '../GetFileDescriptorCount/GetFileDescriptorCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'

export const id = MeasureId.FileDescriptorCount

export const targets: readonly any[] = []

export const create = ({ pid }: { pid: number }) => {
  return [pid]
}

export const start = async (pid: number): Promise<ProcessInfo[]> => {
  return await GetFileDescriptorCount.getFileDescriptorCountForProcess(pid)
}

export const stop = async (pid: number): Promise<ProcessInfo[]> => {
  return await GetFileDescriptorCount.getFileDescriptorCountForProcess(pid)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
