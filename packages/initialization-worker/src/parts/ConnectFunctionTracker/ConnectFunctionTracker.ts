import * as ElectronRpcState from '../ElectronRpcState/ElectronRpcState.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as MonkeyPatchElectronScript from '../MonkeyPatchElectronScript/MonkeyPatchElectronScript.ts'

const SOCKET_PATH = '/tmp/function-tracker-socket'

const protocolInterceptorScript = (socketPath: string): string => {
  return `function() {
  const electron = this
  const { protocol, app } = electron
  // Wait for app to be ready before intercepting protocol
  if (!app.isReady()) {
    console.error('[ProtocolInterceptor] App is not ready yet')
    return '${socketPath}'
  }
  // Capture require in a closure so it's available when protocol handler is called
  // Try to get require from globalThis._____require first, fallback to global.require
  let requireFn = globalThis._____require
  if (!requireFn || typeof requireFn !== 'function') {
    // Try global.require as fallback
    if (typeof global !== 'undefined' && global.require) {
      requireFn = global.require
    }
  }
  if (!requireFn || typeof requireFn !== 'function') {
    console.error('[ProtocolInterceptor] require is not available or not a function', typeof requireFn, requireFn)
    return '${socketPath}'
  }
  // Capture net and fs modules in closure
  const net = requireFn('net')
  const fs = requireFn('fs')
  
  const queryFunctionTracker = (url) => {
    return new Promise((resolve) => {
      const socket = net.createConnection('${socketPath}')
      let responseData = ''
      
      socket.on('connect', () => {
        const request = JSON.stringify({ type: 'transform', url })
        socket.write(request)
      })
      
      socket.on('data', (data) => {
        responseData += data.toString()
      })
      
      socket.on('end', () => {
        try {
          const response = JSON.parse(responseData)
          if (response.type === 'transformed' && response.code) {
            resolve(response.code)
          } else {
            resolve(null)
          }
        } catch (error) {
          console.error('[ProtocolInterceptor] Error parsing response:', error)
          resolve(null)
        }
      })
      
      socket.on('error', (error) => {
        console.error('[ProtocolInterceptor] Socket error:', error)
        resolve(null)
      })
      
      setTimeout(() => {
        socket.destroy()
        resolve(null)
      }, 5000)
    })
  }
  
  protocol.interceptBufferProtocol('vscode-file', async (request, callback) => {
    const url = request.url
    
    if (url.includes('workbench.desktop.main.js')) {
      try {
        const transformedCode = await queryFunctionTracker(url)
        if (transformedCode) {
          callback({
            data: Buffer.from(transformedCode, 'utf8'),
            mimeType: 'application/javascript',
          })
          return
        }
      } catch (error) {
        console.error('[ProtocolInterceptor] Error getting transformed code:', error)
      }
    }
    
    if (url.startsWith('vscode-file://vscode-app')) {
      const filePath = url.slice('vscode-file://vscode-app'.length)
      fs.readFile(filePath, (err, data) => {
        if (err) {
          callback({ error: -6 })
        } else {
          callback({ data, mimeType: 'application/javascript' })
        }
      })
    } else {
      callback({ error: -6 })
    }
  })
  
  return '${socketPath}'
}`
}

export const connectFunctionTracker = async (): Promise<void> => {
  const electronRpcState = ElectronRpcState.getElectronRpc()
  if (!electronRpcState) {
    throw new Error('electronRpc not found in state. Make sure PrepareBoth was called first.')
  }

  const { electronRpc, monkeyPatchedElectronId } = electronRpcState

  // Undo the monkey patch to continue loading the window (this makes app ready)
  // The function-tracker should already be connected before this is called
  await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
    functionDeclaration: MonkeyPatchElectronScript.undoMonkeyPatch,
    objectId: monkeyPatchedElectronId,
  })

  // Now that app is ready, inject protocol interceptor
  // Use globalThis._____electron which was set by MakeElectronAvailableGlobally
  // We need to get the electron object ID first
  try {
    const electronGlobal = await DevtoolsProtocolRuntime.evaluate(electronRpc, {
      expression: 'globalThis._____electron',
      returnByValue: false,
    })
    
    // The result structure can vary, check both possible structures
    const objectId = electronGlobal?.objectId || electronGlobal?.result?.objectId || electronGlobal?.result?.result?.objectId
    
    if (objectId) {
      await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
        functionDeclaration: protocolInterceptorScript(SOCKET_PATH),
        objectId: objectId,
      })
      console.log('[ConnectFunctionTracker] Injected protocol interceptor for function tracking')
    } else {
      console.error('[ConnectFunctionTracker] Could not get electron object ID from globalThis._____electron', JSON.stringify(electronGlobal, null, 2))
    }
  } catch (error) {
    console.error('[ConnectFunctionTracker] Error injecting protocol interceptor:', error)
  }

  // Dispose electronRpc after injecting protocol interceptor
  await electronRpc.dispose()
  ElectronRpcState.clearElectronRpc()
}
