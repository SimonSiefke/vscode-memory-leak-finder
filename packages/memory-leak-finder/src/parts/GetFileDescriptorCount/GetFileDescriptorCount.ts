import { exec } from 'node:child_process'
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
  } catch {
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
  } catch {
    return 'unknown'
  }
}

const getFileDescriptorCount = async (pid: number): Promise<number> => {
  try {
    const fdDir = `/proc/${pid}/fd`
    const { stdout } = await execAsync(`ls ${fdDir} 2>/dev/null | wc -l`)
    const count = Number.parseInt(stdout.trim(), 10)
    return Number.isNaN(count) ? 0 : count
  } catch {
    return 0
  }
}

export const getFileDescriptorCountForProcess = async (pid: number | undefined): Promise<ProcessInfo[]> => {
  if (pid === undefined) {
    return []
  }
  if (platform() !== 'linux') {
    return []
  }
  try {
    const allPids = await getAllDescendantPids(pid)
    const processInfos: ProcessInfo[] = []
    
    for (const processPid of allPids) {
      const [name, fdCount] = await Promise.all([
        getProcessName(processPid),
        getFileDescriptorCount(processPid)
      ])
      
      processInfos.push({
        pid: processPid,
        name,
        fileDescriptorCount: fdCount
      })
    }
    
    // Sort by file descriptor count descending
    processInfos.sort((a, b) => b.fileDescriptorCount - a.fileDescriptorCount)
    
    return processInfos
  } catch {
    return []
  }
}