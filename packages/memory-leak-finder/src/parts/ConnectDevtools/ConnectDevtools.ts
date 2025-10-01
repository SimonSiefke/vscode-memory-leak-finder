import * as Assert from '../Assert/Assert.ts'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import { DevtoolsProtocolRuntime, DevtoolsProtocolTarget } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as GetCombinedMeasure from '../GetCombinedMeasure/GetCombinedMeasure.ts'
import * as MemoryLeakFinderState from '../MemoryLeakFinderState/MemoryLeakFinderState.ts'
import { waitForSession } from '../WaitForSession/WaitForSession.ts'

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
  const handleExecutionContextCreated = async (event: any): Promise<void> => {
    const { params } = event
    const { context } = params
    const { name, id, uniqueId, origin } = context
    
    try {
      // Try to evaluate process information in this execution context
      let processData = null
      let contextInfo = {}
      
      try {
        const processInfo = await DevtoolsProtocolRuntime.evaluate(sessionRpc, {
          expression: `JSON.stringify({
            execPath: process.execPath,
            argv: process.argv,
            pid: process.pid,
            platform: process.platform,
            version: process.version,
            versions: process.versions
          })`,
          contextId: id,
          returnByValue: true
        })
        processData = JSON.parse(processInfo.result.value)
      } catch (processError) {
        // Process not available, try to get other context information
        try {
          const contextInfoResult = await DevtoolsProtocolRuntime.evaluate(sessionRpc, {
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
        } else if (name === 'utility') {
          processType = 'utility'
        } else if (name === 'Electron Isolated Context') {
          processType = 'renderer'
        } else if (origin && origin.includes('vscode-file://vscode-app')) {
          processType = 'renderer'
        } else {
          processType = 'main'
        }
      } else if (contextInfo) {
        if (contextInfo.isElectron) {
          processType = 'electron-context'
        } else if (contextInfo.hasWindow && contextInfo.hasDocument) {
          processType = 'browser-context'
        } else if (contextInfo.hasNode) {
          processType = 'node-context'
        }
      }
      
      console.log(`[Memory Leak Finder] Execution context created:`, {
        name,
        id,
        uniqueId,
        origin,
        processType,
        processInfo: processData ? {
          execPath: processData.execPath,
          argv: processData.argv,
          pid: processData.pid,
          platform: processData.platform,
          version: processData.version
        } : null,
        contextInfo: Object.keys(contextInfo).length > 0 ? contextInfo : null,
        timestamp: new Date().toISOString()
      })
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
    }
  }
  
  sessionRpc.on(DevtoolsEventType.RuntimeExecutionContextCreated, handleExecutionContextCreated)
  
  Promise.all([
    DevtoolsProtocolTarget.setAutoAttach(sessionRpc, {
      autoAttach: true,
      waitForDebuggerOnStart: false,
      flatten: true,
    }),
    DevtoolsProtocolRuntime.enable(sessionRpc),
    DevtoolsProtocolRuntime.runIfWaitingForDebugger(sessionRpc),
  ])
  const measureRpc = measureNode ? electronRpc : sessionRpc
  const measure = await GetCombinedMeasure.getCombinedMeasure(measureRpc, measureId)
  MemoryLeakFinderState.set(connectionId, measure)
}
