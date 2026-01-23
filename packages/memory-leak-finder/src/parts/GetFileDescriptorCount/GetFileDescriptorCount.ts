import { execSync } from 'node:child_process'
import { readFile, readdir } from 'node:fs/promises'
import { platform } from 'node:os'
import { getAllDescendantPids } from '../GetAllPids/GetAllPids.ts'

export interface ProcessInfo {
  readonly pid: number
  readonly name: string
  readonly fileDescriptorCount: number
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
        const typeIndex = args.findIndex((arg) => arg === '--type')
        if (typeIndex >= 0 && typeIndex + 1 < args.length) {
          const processType = args[typeIndex + 1]
          // Map common VS Code process types to readable names
          const typeMap: Record<string, string> = {
            utility: 'VS Code Utility',
            extensionHost: 'VS Code Extension Host',
            'shared-process': 'VS Code Shared Process',
            ptyHost: 'VS Code PTY Host',
            fileWatcher: 'VS Code File Watcher',
            'gpu-process': 'VS Code GPU Process',
            renderer: 'VS Code Renderer',
          }
          if (typeMap[processType]) {
            return typeMap[processType]
          }
          return `VS Code ${processType}`
        }

        // Check for utility-sub-type
        const subTypeIndex = args.findIndex((arg) => arg === '--utility-sub-type')
        if (subTypeIndex >= 0 && subTypeIndex + 1 < args.length) {
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
        if (scriptIndex >= 0) {
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
      return baseName.length > 50 ? `${baseName.substring(0, 47)}...` : baseName
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
