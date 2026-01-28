import { readFile, readdir, readlink } from 'node:fs/promises'
import { platform } from 'node:os'
import { execSync } from 'node:child_process'
import { getAllDescendantPids } from '../GetAllPids/GetAllPids.ts'

export interface FileDescriptorInfo {
  readonly fd: string
  readonly target: string
}

export interface ProcessInfoWithDescriptors {
  readonly fileDescriptorCount: number
  readonly fileDescriptors: FileDescriptorInfo[]
  readonly name: string
  readonly pid: number
}

const getFileDescriptors = async (pid: number): Promise<FileDescriptorInfo[]> => {
  try {
    const fdDir = `/proc/${pid}/fd`
    const files = await readdir(fdDir)
    const descriptors: FileDescriptorInfo[] = []

    for (const fd of files) {
      try {
        const fdPath = `${fdDir}/${fd}`
        const target = await readlink(fdPath)
        descriptors.push({ fd, target })
      } catch (error) {
        // File descriptor might have been closed between listing and reading
        // This is normal, just skip it
        descriptors.push({ fd, target: '<unavailable>' })
      }
    }

    return descriptors
  } catch (error) {
    console.log(`[GetFileDescriptors] Error getting file descriptors for ${pid}:`, error)
    return []
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
    console.log(`[GetFileDescriptors] Error getting process name for ${pid}:`, error)
    // Fallback to ps command
    try {
      const stdout = execSync(`ps -p ${pid} -o comm=`).toString()
      return stdout.trim() || 'unknown'
    } catch {
      return 'unknown'
    }
  }
}

export const getFileDescriptorsForProcess = async (
  pid: number | undefined,
): Promise<ProcessInfoWithDescriptors[]> => {
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
    const processInfos: ProcessInfoWithDescriptors[] = []

    for (const processPid of allPids) {
      const [name, fileDescriptors] = await Promise.all([getProcessName(processPid), getFileDescriptors(processPid)])

      processInfos.push({
        fileDescriptorCount: fileDescriptors.length,
        fileDescriptors,
        name,
        pid: processPid,
      })
    }

    // Sort by file descriptor count descending
    processInfos.sort((a, b) => b.fileDescriptorCount - a.fileDescriptorCount)

    console.log(`[GetFileDescriptors] Returning ${processInfos.length} process infos`)
    return processInfos
  } catch (error) {
    console.log(`[GetFileDescriptors] Error getting file descriptors for PID ${pid}:`, error)
    return []
  }
}
