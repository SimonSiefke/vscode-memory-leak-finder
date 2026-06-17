import { readdir, readlink } from 'node:fs/promises'
import { describeFd } from '../GetFileDescriptorCount/GetFileDescriptorCount.ts'

/**
 * Get detailed information about all file descriptors for a process
 */
export const getDetailedFileDescriptors = async (pid: number): Promise<Array<{ description: string; fd: string; target: string }>> => {
  try {
    const fdDir = `/proc/${pid}/fd`
    const files = await readdir(fdDir)
    const fdDetails: Array<{ description: string; fd: string; target: string }> = []

    for (const fd of files) {
      try {
        const fdPath = `${fdDir}/${fd}`
        const target = await readlink(fdPath)
        const description = describeFd(fd, target)
        fdDetails.push({ description, fd, target })
      } catch {
        // Ignore errors reading individual FDs (they may close between readdir and readlink)
      }
    }

    return fdDetails
  } catch (error) {
    console.log(`[GetDetailedFileDescriptors] Error getting detailed FDs for ${pid}:`, error)
    return []
  }
}
