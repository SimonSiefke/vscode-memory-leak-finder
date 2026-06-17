import type { ProcessInfo } from '../GetFileDescriptorCount/GetFileDescriptorCount.ts'
import * as CompareFileDescriptorCount from '../CompareFileDescriptorCount/CompareFileDescriptorCount.ts'
import * as GetFileDescriptorCount from '../GetFileDescriptorCount/GetFileDescriptorCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'

export const id = MeasureId.FileDescriptorCount

export const targets: readonly any[] = []

export const create = ({ pid }: { pid: number }) => {
  console.log({ pid })

  return [pid]
}

export const start = async (pid: number): Promise<ProcessInfo[]> => {
  return await GetFileDescriptorCount.getFileDescriptorCountForProcess(pid)
}

export const stop = async (pid: number): Promise<ProcessInfo[]> => {
  return await GetFileDescriptorCount.getFileDescriptorCountForProcess(pid)
}

export const compare = CompareFileDescriptorCount.compareFileDescriptorCount

export const isLeak = (result: readonly any[]) => {
  return result.length > 0
}
