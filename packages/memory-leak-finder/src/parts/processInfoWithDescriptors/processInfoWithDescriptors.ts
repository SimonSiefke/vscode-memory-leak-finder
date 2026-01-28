import type { FileDescriptorInfo } from '../fileDescriptorInfo/fileDescriptorInfo.ts'

export interface ProcessInfoWithDescriptors {
  readonly fileDescriptorCount: number
  readonly fileDescriptors: FileDescriptorInfo[]
  readonly name: string
  readonly pid: number
}
