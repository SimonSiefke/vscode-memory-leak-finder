import { getVSCodeProcessName } from '../getVSCodeProcessName/index.js'
import { getNodeJSProcessName } from '../getNodeJSProcessName/index.js'

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

export { getProcessNameFromCmdline }
