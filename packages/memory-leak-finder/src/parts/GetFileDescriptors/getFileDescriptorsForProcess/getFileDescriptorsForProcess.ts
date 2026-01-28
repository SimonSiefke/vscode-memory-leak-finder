import { platform } from 'node:os'
import { getAllDescendantPids } from '../../GetAllPids/GetAllPids.ts'
import type { ProcessInfoWithDescriptors } from '../ProcessInfoWithDescriptors/ProcessInfoWithDescriptors.ts'
import { getProcessName } from '../getProcessName/getProcessName.ts'
import { getFileDescriptors } from '../getFileDescriptors/getFileDescriptors.ts'

export const getFileDescriptorsForProcess = async (pid: number | undefined): Promise<ProcessInfoWithDescriptors[]> => {
  if (pid === undefined) {
    console.log('[GetFileDescriptors] PID is undefined, returning empty array')
    return []
  }
  if (platform() !== 'linux') {
    console.log(`[GetFileDescriptors] Platform is ${platform()}, not Linux, returning empty array`)
    return []
  }
  try {
    const allPids = await getAllDescendantPids(pid)
    console.log(`[GetFileDescriptors] Found ${allPids.length} processes (including main process ${pid})`)

    // Process all PIDs in parallel
    const processInfos = await Promise.all(
      allPids.map(async (processPid) => {
        const [name, fileDescriptors] = await Promise.all([getProcessName(processPid), getFileDescriptors(processPid)])

        return {
          fileDescriptorCount: fileDescriptors.length,
          fileDescriptors,
          name,
          pid: processPid,
        }
      }),
    )

    // Sort by file descriptor count descending
    processInfos.sort((a, b) => b.fileDescriptorCount - a.fileDescriptorCount)

    console.log(`[GetFileDescriptors] Returning ${processInfos.length} process infos`)
    return processInfos
  } catch (error) {
    console.log(`[GetFileDescriptors] Error getting file descriptors for PID ${pid}:`, error)
    return []
  }
}
