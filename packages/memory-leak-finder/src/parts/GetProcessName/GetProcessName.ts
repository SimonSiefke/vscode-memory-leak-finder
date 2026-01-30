import { readFile } from 'node:fs/promises'
import { execSync } from 'node:child_process'
import { isEnoentError } from '../IsEnoentError/IsEnoentError.ts'

const typeMap: Record<string, string> = {
  extensionHost: 'VS Code Extension Host',
  fileWatcher: 'VS Code File Watcher',
  'gpu-process': 'VS Code GPU Process',
  ptyHost: 'VS Code PTY Host',
  renderer: 'VS Code Renderer',
  'shared-process': 'VS Code Shared Process',
  utility: 'VS Code Utility',
}

const getVSCodeProcessName = (args: string[]): string | null => {
  // Check for specific VS Code process types
  const typeIndex = args.indexOf('--type')
  if (typeIndex !== -1 && typeIndex + 1 < args.length) {
    const processType = args[typeIndex + 1]
    // Map common VS Code process types to readable names

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

const getNodeJSProcessName = (args: string[]): string => {
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

const getProcessNameFromCmdline = (cmdline: string): string | null => {
  // cmdline is null-separated arguments, split and filter empty strings
  const args = cmdline.split('\0').filter((arg) => arg.length > 0)

  if (args.length === 0) {
    return null
  }

  const firstArg = args[0]

  // Handle VS Code processes
  if (firstArg.includes('code') || firstArg.includes('vscode')) {
    return getVSCodeProcessName(args)
  }

  // Handle Node.js processes
  if (firstArg.includes('node') || firstArg.includes('nodejs')) {
    return getNodeJSProcessName(args)
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

const getProcessNameFromPs = (pid: number): string => {
  try {
    const stdout = execSync(`ps -p ${pid} -o comm=`).toString()
    return stdout.trim() || 'unknown'
  } catch {
    return 'unknown'
  }
}

export const getProcessName = async (pid: number): Promise<string> => {
  try {
    // Try to read command line from /proc/[pid]/cmdline for more detailed info
    const cmdlinePath = `/proc/${pid}/cmdline`
    const cmdline = await readFile(cmdlinePath, 'utf-8')

    const name = getProcessNameFromCmdline(cmdline)
    if (name) {
      return name
    }

    // Fallback to using ps command
    return getProcessNameFromPs(pid)
  } catch (error) {
    // Silently ignore ENOENT errors - the process was cleaned up/killed, which is fine
    if (isEnoentError(error)) {
      return getProcessNameFromPs(pid)
    }
    console.log(`[GetFileDescriptors] Error getting process name for ${pid}:`, error)
    // Fallback to ps command
    return getProcessNameFromPs(pid)
  }
}
