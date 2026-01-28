import type { FileDescriptorInfo } from '../FileDescriptorInfo/FileDescriptorInfo.ts'

export interface ProcessInfoWithDescriptors {
  readonly fileDescriptorCount: number
  readonly fileDescriptors: FileDescriptorInfo[]
  readonly name: string
  readonly pid: number
}
