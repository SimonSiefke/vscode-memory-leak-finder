import { execSync } from 'node:child_process'
import { readdir } from 'node:fs/promises'
import { platform } from 'node:os'
import { getAllDescendantPids } from '../GetAllPids/GetAllPids.ts'

export interface ProcessInfo {
  pid: number
  name: string
  fileDescriptorCount: number
}

const getFileDescriptorCount = async (pid: number): Promise<number> => {
  try {
    const fdDir = `/proc/${pid}/fd`
    const files = await readdir(fdDir)
    return files.length
  } catch (error) {
    console.log(`[GetFileDescriptorCount] Error getting file descriptor count for ${pid}:`, error)
    return 0
  }
}

const getProcessName = async (pid: number): Promise<string> => {
  try {
    const stdout = execSync(`ps -p ${pid} -o comm=`).toString()
    return stdout.trim() || 'unknown'
  } catch (error) {
    console.log(`[GetFileDescriptorCount] Error getting process name for ${pid}:`, error)
    return 'unknown'
  }
}

export const getFileDescriptorCountForProcess = async (pid: number | undefined): Promise<ProcessInfo[]> => {
  if (pid === undefined) {
    console.log('[GetFileDescriptorCount] PID is undefined, returning empty array')
    return []
  }
  if (platform() !== 'linux') {
    console.log(`[GetFileDescriptorCount] Platform is ${platform()}, not Linux, returning empty array`)
    return []
  }
  try {
    const allPids = await getAllDescendantPids(pid)
    console.log(`[GetFileDescriptorCount] Found ${allPids.length} processes (including main process ${pid})`)
    const processInfos: ProcessInfo[] = []

    for (const processPid of allPids) {
      const [name, fdCount] = await Promise.all([getProcessName(processPid), getFileDescriptorCount(processPid)])

      processInfos.push({
        pid: processPid,
        name,
        fileDescriptorCount: fdCount,
      })
    }

    // Sort by file descriptor count descending
    processInfos.sort((a, b) => b.fileDescriptorCount - a.fileDescriptorCount)

    console.log(`[GetFileDescriptorCount] Returning ${processInfos.length} process infos`)
    return processInfos
  } catch (error) {
    console.log(`[GetFileDescriptorCount] Error getting file descriptor count for PID ${pid}:`, error)
    return []
  }
}
