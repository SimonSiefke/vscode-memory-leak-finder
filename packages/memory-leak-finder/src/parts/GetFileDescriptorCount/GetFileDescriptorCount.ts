import { execSync } from 'node:child_process'
import { readFile, readdir, readlink } from 'node:fs/promises'
import { platform } from 'node:os'
import { getAllDescendantPids } from '../GetAllPids/GetAllPids.ts'
import { describeFdTarget } from './DescribeFdTarget.ts'

export interface ProcessInfo {
  readonly fileDescriptorCount: number
  readonly name: string
  readonly pid: number
}

/**
 * Get detailed information about a specific file descriptor
 */
export const describeFd = (fd: string, target: string): string => {
  const description = describeFdTarget(target)

  // Add special notes for standard file descriptors
  if (fd === '0') {
    return `stdin (${description})`
  }
  if (fd === '1') {
    return `stdout (${description})`
  }
  if (fd === '2') {
    return `stderr (${description})`
  }

  return description
}

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
    console.log(`[GetFileDescriptorCount] Error getting detailed FDs for ${pid}:`, error)
    return []
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

export const getProcessName = async (pid: number): Promise<string> => {
  try {
    // Try to read command line from /proc/[pid]/cmdline for more detailed info
    const cmdlinePath = `/proc/${pid}/cmdline`
    const cmdline = await readFile(cmdlinePath, 'utf-8')

    // cmdline is null-separated arguments, split and filter empty strings
    const args = cmdline.split('\0').filter((arg) => arg.length > 0)

    if (args.length > 0) {
      // Extract meaningful process name from command line
      const firstArg = args[0]

      // Handle VS Code processes
      if (firstArg.includes('code') || firstArg.includes('vscode')) {
        // Check for specific VS Code process types
        const typeIndex = args.indexOf('--type')
        if (typeIndex !== -1 && typeIndex + 1 < args.length) {
          const processType = args[typeIndex + 1]
          // Map common VS Code process types to readable names
          const typeMap: Record<string, string> = {
            extensionHost: 'VS Code Extension Host',
            fileWatcher: 'VS Code File Watcher',
            'gpu-process': 'VS Code GPU Process',
            ptyHost: 'VS Code PTY Host',
            renderer: 'VS Code Renderer',
            'shared-process': 'VS Code Shared Process',
            utility: 'VS Code Utility',
          }
          if (typeMap[processType]) {
            return typeMap[processType]
          }
          return `VS Code ${processType}`
        }

        // Check for utility-sub-type
        const subTypeIndex = args.indexOf('--utility-sub-type')
        if (subTypeIndex !== -1 && subTypeIndex + 1 < args.length) {
          const subType = args[subTypeIndex + 1]
          if (subType.includes('node.mojom.NodeService')) {
            return 'VS Code Node Service'
          }
          if (subType.includes('network.mojom.NetworkService')) {
            return 'VS Code Network Service'
          }
          if (subType.includes('storage.mojom.StorageService')) {
            return 'VS Code Storage Service'
          }
          return `VS Code ${subType.split('.').pop()}`
        }

        // Check for extension host
        if (args.some((arg) => arg.includes('extensionHost'))) {
          return 'VS Code Extension Host'
        }

        return 'VS Code'
      }

      // Handle Node.js processes
      if (firstArg.includes('node') || firstArg.includes('nodejs')) {
        // Check if it's a worker process
        if (args.some((arg) => arg.includes('worker'))) {
          return 'Node.js Worker'
        }
        // Check for specific script names
        const scriptIndex = args.findIndex((arg) => arg.endsWith('.js') || arg.endsWith('.ts'))
        if (scriptIndex !== -1) {
          const scriptName = args[scriptIndex].split('/').pop() || 'script'
          return `Node.js ${scriptName}`
        }
        return 'Node.js'
      }

      // Handle other common processes
      if (firstArg.includes('bash') || firstArg.includes('sh')) {
        return 'Shell'
      }

      if (firstArg.includes('python')) {
        return 'Python'
      }

      // Return the base name of the first argument
      const baseName = firstArg.split('/').pop() || firstArg
      return baseName.length > 50 ? `${baseName.slice(0, 47)}...` : baseName
    }

    // Fallback to using ps command
    const stdout = execSync(`ps -p ${pid} -o comm=`).toString()
    return stdout.trim() || 'unknown'
  } catch (error) {
    console.log(`[GetFileDescriptorCount] Error getting process name for ${pid}:`, error)
    // Fallback to ps command
    try {
      const stdout = execSync(`ps -p ${pid} -o comm=`).toString()
      return stdout.trim() || 'unknown'
    } catch {
      return 'unknown'
    }
  }
}

export const getFileDescriptorCountForProcess = async (pid: number | undefined, platformName: string = platform()): Promise<ProcessInfo[]> => {
  if (pid === undefined) {
    console.log('[GetFileDescriptorCount] PID is undefined, returning empty array')
    return []
  }
  if (platformName !== 'linux') {
    console.log(`[GetFileDescriptorCount] Platform is ${platformName}, not Linux, returning empty array`)
    return []
  }
  try {
    const allPids = await getAllDescendantPids(pid)
    console.log(`[GetFileDescriptorCount] Found ${allPids.length} processes (including main process ${pid})`)
    const processInfos: ProcessInfo[] = []

    for (const processPid of allPids) {
      const [name, fdCount] = await Promise.all([getProcessName(processPid), getFileDescriptorCount(processPid)])

      processInfos.push({
        fileDescriptorCount: fdCount,
        name,
        pid: processPid,
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
