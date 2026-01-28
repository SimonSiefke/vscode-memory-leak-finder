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

export { getNodeJSProcessName }
