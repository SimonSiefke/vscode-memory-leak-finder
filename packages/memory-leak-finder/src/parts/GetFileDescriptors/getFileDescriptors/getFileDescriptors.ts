import { readdir, readlink } from 'node:fs/promises'
import type { FileDescriptorInfo } from '../FileDescriptorInfo/FileDescriptorInfo.ts'
import * as GetFileDescriptorCount from '../../GetFileDescriptorCount/GetFileDescriptorCount.ts'

export const getFileDescriptors = async (pid: number): Promise<FileDescriptorInfo[]> => {
  try {
    const fdDir = `/proc/${pid}/fd`
    const files = await readdir(fdDir)
    const descriptors: FileDescriptorInfo[] = []

    // Process all file descriptors in parallel
    const results = await Promise.allSettled(
      files.map(async (fd) => {
        const fdPath = `${fdDir}/${fd}`
        const target = await readlink(fdPath)
        const description = GetFileDescriptorCount.describeFd(fd, target)
        return { description, fd, target }
      })
    )

    for (const result of results) {
      if (result.status === 'fulfilled') {
        descriptors.push(result.value)
      } else {
        // File descriptor might have been closed between listing and reading
        // This is normal, just skip it or add unavailable marker
        // We can't access the fd here, so we'll add a generic unavailable entry
        descriptors.push({ description: 'unavailable', fd: 'unknown', target: '<unavailable>' })
      }
    }

    return descriptors
  } catch (error) {
    console.log(`[GetFileDescriptors] Error getting file descriptors for ${pid}:`, error)
    return []
  }
}
