import * as Assert from '../Assert/Assert.ts'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import { DevtoolsProtocolRuntime, DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as GetCombinedMeasure from '../GetCombinedMeasure/GetCombinedMeasure.ts'
import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'
import { waitForSession } from '../WaitForSession/WaitForSession.ts'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const getChildProcesses = async (parentPid: number): Promise<void> => {
  try {
    console.log(`[Memory Leak Finder] Getting child processes for PID ${parentPid}`)

    // Get all child processes using ps command
    const { stdout } = await execAsync(`ps -eo pid,ppid,cmd --no-headers | grep "^[[:space:]]*[0-9]*[[:space:]]*${parentPid}[[:space:]]"`)
    const lines = stdout.trim().split('\n').filter(line => line.trim())

    console.log(`[Memory Leak Finder] Found ${lines.length} child processes:`)

    for (const line of lines) {
      const parts = line.trim().split(/\s+/, 3)
      if (parts.length >= 3) {
        const pid = parts[0]
        const ppid = parts[1]
        const cmd = parts[2]

        // Try to get more detailed info about the process
        try {
          const { stdout: procInfo } = await execAsync(`ps -p ${pid} -o pid,ppid,cmd,args --no-headers 2>/dev/null || echo "Process not found"`)
          console.log(`[Memory Leak Finder] Child Process ${pid}:`)
          console.log(`  Command: ${cmd}`)
          console.log(`  Full args: ${procInfo.trim()}`)
          
          // Try to identify process type based on command line arguments
          let processType = 'unknown'
          const fullArgs = procInfo.trim()
          
          if (fullArgs.includes('--type=renderer')) {
            processType = 'renderer-process'
          } else if (fullArgs.includes('--type=utility')) {
            if (fullArgs.includes('--utility-sub-type=network.mojom.NetworkService')) {
              processType = 'network-service-process'
            } else if (fullArgs.includes('--utility-sub-type=node.mojom.NodeService')) {
              processType = 'node-service-process'
            } else {
              processType = 'utility-process'
            }
          } else if (fullArgs.includes('--type=shared')) {
            processType = 'shared-process'
          } else if (fullArgs.includes('--type=extensionHost')) {
            processType = 'extension-host-process'
          } else if (fullArgs.includes('--type=worker')) {
            processType = 'worker-process'
          } else if (fullArgs.includes('--type=node')) {
            processType = 'node-process'
          } else if (fullArgs.includes('--type=gpu-process')) {
            processType = 'gpu-process'
          } else if (fullArgs.includes('--type=zygote')) {
            processType = 'zygote-process'
          } else if (cmd.includes('code') && !fullArgs.includes('--type=')) {
            processType = 'main-process'
          }
          
          // Check for debugging ports in the arguments
          const debugPortMatch = fullArgs.match(/--inspect-port=(\d+)/)
          const debugBrkMatch = fullArgs.match(/--inspect-brk=(\d+)/)
          const remoteDebuggingMatch = fullArgs.match(/--remote-debugging-port=(\d+)/)
          
          if (debugPortMatch) {
            console.log(`  Debug Port: ${debugPortMatch[1]}`)
          }
          if (debugBrkMatch) {
            console.log(`  Debug Brk Port: ${debugBrkMatch[1]}`)
          }
          if (remoteDebuggingMatch) {
            console.log(`  Remote Debugging Port: ${remoteDebuggingMatch[1]}`)
          }
          
          // If this is a Node.js service process with inspect-port=0, try to find the actual port
          if (processType === 'node-service-process' && fullArgs.includes('--inspect-port=0')) {
            try {
              // Try multiple methods to find the debug port
              console.log(`  Attempting to find debug port for Node.js service process...`)
              
              // Method 1: netstat
              try {
                const { stdout: netstatOutput } = await execAsync(`netstat -tlnp 2>/dev/null | grep ${pid} || echo "No netstat results"`)
                if (!netstatOutput.includes('No netstat results')) {
                  const portMatch = netstatOutput.match(/:(\d+).*LISTEN.*${pid}/)
                  if (portMatch) {
                    console.log(`  Actual Debug Port (netstat): ${portMatch[1]}`)
                  }
                }
              } catch (netstatError) {
                console.log(`  Netstat failed: ${netstatError.message}`)
              }
              
              // Method 2: lsof
              try {
                const { stdout: lsofOutput } = await execAsync(`lsof -p ${pid} 2>/dev/null | grep LISTEN || echo "No lsof results"`)
                if (!lsofOutput.includes('No lsof results')) {
                  const portMatch = lsofOutput.match(/:(\d+).*LISTEN/)
                  if (portMatch) {
                    console.log(`  Actual Debug Port (lsof): ${portMatch[1]}`)
                  }
                }
              } catch (lsofError) {
                console.log(`  Lsof failed: ${lsofError.message}`)
              }
              
              // Method 3: Check if we can connect to common debug ports
              const commonDebugPorts = [9229, 9230, 9231, 9232, 9233, 9234, 9235, 9236, 9237, 9238, 9239, 9240]
              for (const port of commonDebugPorts) {
                try {
                  const { stdout: curlOutput } = await execAsync(`curl -s http://localhost:${port}/json 2>/dev/null || echo "Port ${port} not available"`)
                  if (!curlOutput.includes('not available') && curlOutput.includes('"id"')) {
                    console.log(`  Found debug port via curl: ${port}`)
                    break
                  }
                } catch (curlError) {
                  // Port not available, continue
                }
              }
              
            } catch (error) {
              console.log(`  Could not determine actual debug port: ${error.message}`)
            }
          }

          console.log(`  Type: ${processType}`)
          console.log('')
        } catch (error) {
          console.log(`[Memory Leak Finder] Could not get details for PID ${pid}: ${error.message}`)
        }
      }
    }
  } catch (error) {
    console.log(`[Memory Leak Finder] Error getting child processes: ${error.message}`)
  }
}

const getExecutionContextDetails = async (
  sessionRpc: any,
  context: { name: string; id: number; uniqueId: string; origin: string }
): Promise<{
  processType: string
  processInfo: any
  contextInfo: any
}> => {
  const { name, id, uniqueId, origin } = context

  try {
    // Try to evaluate process information in this execution context
    let processData = null
    let contextInfo = {}

    try {
      const processInfo = await DevtoolsProtocolRuntime.evaluate(rpcConnection, {
        expression: `JSON.stringify({
          execPath: process.execPath,
          argv: process.argv,
          pid: process.pid,
          platform: process.platform,
          version: process.version,
          versions: process.versions,
          cwd: process.cwd,
          title: process.title
        })`,
        contextId: id,
        returnByValue: true
      })
      processData = JSON.parse(processInfo.result.value)
    } catch (processError) {
      // Process not available, try to get other context information
      try {
        const contextInfoResult = await DevtoolsProtocolRuntime.evaluate(rpcConnection, {
          expression: `JSON.stringify({
            userAgent: navigator.userAgent,
            location: window.location ? window.location.href : 'no location',
            isElectron: typeof process !== 'undefined' && process.versions && process.versions.electron,
            hasNode: typeof process !== 'undefined',
            hasWindow: typeof window !== 'undefined',
            hasDocument: typeof document !== 'undefined'
          })`,
          contextId: id,
          returnByValue: true
        })
        contextInfo = JSON.parse(contextInfoResult.result.value)
      } catch (contextError) {
        // Fallback to basic info
      }
    }

    // Determine process type based on available information
    let processType = 'unknown'
    if (processData) {
      if (processData.argv && processData.argv.some((arg: string) => arg.includes('--type=renderer'))) {
        processType = 'renderer'
      } else if (processData.argv && processData.argv.some((arg: string) => arg.includes('--type=utility'))) {
        processType = 'utility'
      } else if (processData.argv && processData.argv.some((arg: string) => arg.includes('--type=worker'))) {
        processType = 'worker'
      } else if (processData.argv && processData.argv.some((arg: string) => arg.includes('--type=node'))) {
        processType = 'node'
      } else if (processData.argv && processData.argv.some((arg: string) => arg.includes('--type=shared'))) {
        processType = 'shared-process'
      } else if (processData.argv && processData.argv.some((arg: string) => arg.includes('--type=extensionHost'))) {
        processType = 'extension-host'
      } else if (name === 'utility') {
        processType = 'utility'
      } else if (name === 'Electron Isolated Context') {
        processType = 'renderer'
      } else if (origin && origin.includes('vscode-file://vscode-app')) {
        processType = 'renderer'
      } else {
        processType = 'main'
      }
    } else {
      // Fallback to context name and origin analysis
      if (name === 'utility') {
        processType = 'utility-process'
      } else if (name === 'Electron Isolated Context') {
        processType = 'renderer-process'
      } else if (origin && origin.includes('vscode-file://vscode-app')) {
        processType = 'renderer-process'
      } else if (name && name.includes('/code[') && name.includes(']')) {
        processType = 'main-process'
      } else if (contextInfo) {
        if (contextInfo.isElectron) {
          processType = 'electron-context'
        } else if (contextInfo.hasWindow && contextInfo.hasDocument) {
          processType = 'browser-context'
        } else if (contextInfo.hasNode) {
          processType = 'node-context'
        }
      } else {
        processType = 'main-process'
      }
    }

    return {
      processType,
      processInfo: processData ? {
        execPath: processData.execPath,
        argv: processData.argv,
        pid: processData.pid,
        platform: processData.platform,
        version: processData.version
      } : null,
      contextInfo: Object.keys(contextInfo).length > 0 ? contextInfo : null
    }
  } catch (error) {
    return {
      processType: 'unknown',
      processInfo: null,
      contextInfo: null
    }
  }
}

export const connectDevtools = async (
  devtoolsWebSocketUrl: string,
  electronWebSocketUrl: string,
  connectionId: number,
  measureId: string,
  attachedToPageTimeout: number,
  measureNode: boolean,
): Promise<void> => {
  // TODO connect to electron and node processes if should measure node
  Assert.string(devtoolsWebSocketUrl)
  Assert.string(electronWebSocketUrl)
  Assert.number(connectionId)
  Assert.string(measureId)
  Assert.number(attachedToPageTimeout)
  const [electronRpc, browserRpc] = await Promise.all([
    DebuggerCreateIpcConnection.createConnection(electronWebSocketUrl),
    DebuggerCreateIpcConnection.createConnection(devtoolsWebSocketUrl),
  ])
  const { sessionRpc } = await waitForSession(browserRpc, attachedToPageTimeout)

  // Set up event handler for execution context created events
  const handleExecutionContextCreated = async (event: any, rpcConnection: any): Promise<any> => {
    const { params } = event
    const { context } = params
    const { name, id, uniqueId, origin } = context

    try {
      const details = await getExecutionContextDetails(rpcConnection, context)

      console.log(`[Memory Leak Finder] Execution context created:`, {
        name,
        id,
        uniqueId,
        origin,
        processType: details.processType,
        processInfo: details.processInfo,
        contextInfo: details.contextInfo,
        timestamp: new Date().toISOString()
      })

      return details
    } catch (error) {
      // If we can't evaluate anything, just log the basic context info
      console.log(`[Memory Leak Finder] Execution context created (evaluation failed):`, {
        name,
        id,
        uniqueId,
        origin,
        error: error.message,
        timestamp: new Date().toISOString()
      })

      return null
    }
  }

  // Set up execution context monitoring for both connections
  console.log(`[Memory Leak Finder] Setting up execution context monitoring for both connections`)
  let mainProcessPid: number | null = null

  sessionRpc.on(DevtoolsEventType.RuntimeExecutionContextCreated, (event: any) => {
    console.log(`[Memory Leak Finder] Execution context created on sessionRpc (devtools frontend)`)
    handleExecutionContextCreated(event, sessionRpc)
  })
  electronRpc.on(DevtoolsEventType.RuntimeExecutionContextCreated, async (event: any) => {
    console.log(`[Memory Leak Finder] Execution context created on electronRpc (main process)`)
    const result = await handleExecutionContextCreated(event, electronRpc)

    // If this is the main process, try to extract PID from the name or process info
    if (result && result.processType === 'main-process' && !mainProcessPid) {
      let pid: number | null = null

      // Try to get PID from process info first
      if (result.processInfo && result.processInfo.pid) {
        pid = result.processInfo.pid
      } else {
        // Extract PID from the context name (format: /path/to/code[PID])
        const name = event.params.context.name
        const match = name.match(/\[(\d+)\]$/)
        if (match) {
          pid = parseInt(match[1], 10)
        }
      }

      if (pid) {
        mainProcessPid = pid
        console.log(`[Memory Leak Finder] Main process PID detected: ${mainProcessPid}`)

        // Wait a bit for child processes to be created, then inspect them
        setTimeout(async () => {
          await getChildProcesses(mainProcessPid!)
        }, 2000)
      }
    }
  })

  Promise.all([
    DevtoolsProtocolTarget.setAutoAttach(sessionRpc, {
      autoAttach: true,
      waitForDebuggerOnStart: false,
      flatten: true,
    }),
    DevtoolsProtocolRuntime.enable(sessionRpc),
    DevtoolsProtocolRuntime.runIfWaitingForDebugger(sessionRpc),
    DevtoolsProtocolRuntime.enable(electronRpc),
    DevtoolsProtocolRuntime.runIfWaitingForDebugger(electronRpc),
  ])
  const measureRpc = measureNode ? electronRpc : sessionRpc
  const measure = await GetCombinedMeasure.getCombinedMeasure(measureRpc, measureId)
  MemoryLeakFinderState.set(connectionId, measure)
}
