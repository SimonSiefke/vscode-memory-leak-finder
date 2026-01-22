import { exec } from 'node:child_process'
import { readdir } from 'node:fs/promises'
import { platform } from 'node:os'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

export interface ProcessInfo {
  pid: number
  name: string
  fileDescriptorCount: number
}

const getChildPids = async (pid: number): Promise<readonly number[]> => {
  try {
    const { stdout } = await execAsync(`pgrep -P ${pid}`)
    const childPids = stdout
      .trim()
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => Number.parseInt(line.trim(), 10))
      .filter((pid) => !Number.isNaN(pid))
    return childPids
  } catch (error) {
    console.log(`[GetFileDescriptorCount] Error getting child PIDs for ${pid}:`, error)
    return []
  }
}

const getAllDescendantPids = async (pid: number): Promise<readonly number[]> => {
  const allPids: number[] = [pid]
  const childPids = await getChildPids(pid)
  for (const childPid of childPids) {
    const descendants = await getAllDescendantPids(childPid)
    allPids.push(...descendants)
  }
  return allPids
}

const getProcessName = async (pid: number): Promise<string> => {
  try {
    const { stdout } = await execAsync(`ps -p ${pid} -o comm=`)
    return stdout.trim() || 'unknown'
  } catch (error) {
    console.log(`[GetFileDescriptorCount] Error getting process name for ${pid}:`, error)
    return 'unknown'
  }
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
