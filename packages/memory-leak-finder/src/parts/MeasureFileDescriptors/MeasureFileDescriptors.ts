import type { ProcessInfoWithDescriptors } from '../ProcessInfoWithDescriptors/ProcessInfoWithDescriptors.ts'
import * as CompareFileDescriptors from '../CompareFileDescriptors/CompareFileDescriptors.ts'
import { getFileDescriptorsForProcess } from '../GetFileDescriptorsForProcess/GetFileDescriptorsForProcess.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'

export const id = MeasureId.FileDescriptors

export const targets: readonly any[] = []

export const create = ({ pid }: { pid: number }) => {
  console.log({ pid })

  return [pid]
}

export const start = async (pid: number): Promise<ProcessInfoWithDescriptors[]> => {
  return await getFileDescriptorsForProcess(pid)
}

export const stop = async (pid: number): Promise<ProcessInfoWithDescriptors[]> => {
  return await getFileDescriptorsForProcess(pid)
}

export const compare = CompareFileDescriptors.compareFileDescriptors

export const isLeak = (result: readonly any[]) => {
  return result.length > 0
}
