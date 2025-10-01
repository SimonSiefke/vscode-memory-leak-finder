// Monkey patch utilityProcess.fork to add debugging ports and track utility processes

export const monkeyPatchUtilityProcessScript = `function () {
  const electron = this
  const { utilityProcess } = electron

  if (!utilityProcess || !utilityProcess.fork) {
    console.log('[Memory Leak Finder] utilityProcess.fork not available, skipping monkey patch')
    return
  }

  // Initialize global utility processes tracking
  if (!globalThis.___utilityProcesses) {
    globalThis.___utilityProcesses = new Map()
  }

  // Port counter starting from 3017
  let nextDebugPort = 3017

  const originalFork = utilityProcess.fork.bind(utilityProcess)

  const patchedFork = (modulePath, args = [], options = {}) => {
    console.log('[Memory Leak Finder] 🎯 INTERCEPTING utilityProcess.fork call!')
    console.log('[Memory Leak Finder] Module path:', modulePath)
    console.log('[Memory Leak Finder] Original args:', args)
    console.log('[Memory Leak Finder] Original options:', options)

    // Create a copy of args to avoid modifying the original
    const modifiedArgs = [...args]

    // Add debugging port if not already present
    const hasInspectPort = modifiedArgs.some(arg => arg.startsWith('--inspect-port='))
    if (!hasInspectPort) {
      const debugPort = nextDebugPort++
      modifiedArgs.push(\`--inspect-port=\${debugPort}\`)
      console.log(\`[Memory Leak Finder] Added debug port \${debugPort} to utility process\`)
    }

    // Create modified options
    const modifiedOptions = { ...options }

    console.log('[Memory Leak Finder] Modified args:', modifiedArgs)
    console.log('[Memory Leak Finder] Modified options:', modifiedOptions)

    // Call the original fork with modified arguments
    const child = originalFork(modulePath, modifiedArgs, modifiedOptions)

    // Store the process info in global tracking
    if (child && child.pid) {
      const debugPort = modifiedArgs.find(arg => arg.startsWith('--inspect-port='))?.split('=')[1]
      console.log(\`[Memory Leak Finder] Child process created with PID: \${child.pid}\`)
      console.log(\`[Memory Leak Finder] Debug port found: \${debugPort}\`)
      if (debugPort) {
        globalThis.___utilityProcesses.set(child.pid, {
          pid: child.pid,
          debugPort: parseInt(debugPort, 10),
          modulePath,
          args: modifiedArgs,
          options: modifiedOptions,
          child
        })
        console.log(\`[Memory Leak Finder] ✅ Stored utility process \${child.pid} with debug port \${debugPort}\`)
        console.log(\`[Memory Leak Finder] Map size: \${globalThis.___utilityProcesses.size}\`)
      } else {
        console.log(\`[Memory Leak Finder] ❌ No debug port found for process \${child.pid}\`)
      }
    } else {
      console.log(\`[Memory Leak Finder] ❌ No child process or PID returned\`)
    }

    return child
  }

  // Replace the original fork method
  utilityProcess.fork = patchedFork

  console.log('[Memory Leak Finder] Successfully monkey patched utilityProcess.fork')

  return () => {
    // Restore original fork method
    utilityProcess.fork = originalFork
    console.log('[Memory Leak Finder] Restored original utilityProcess.fork')
  }
}`

export const undoMonkeyPatch = `function () {
  const fn = this
  return fn()
}`
