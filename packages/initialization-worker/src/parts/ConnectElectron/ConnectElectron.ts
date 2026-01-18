import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import { DevtoolsProtocolDebugger, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as MakeElectronAvailableGlobally from '../MakeElectronAvailableGlobally/MakeElectronAvailableGlobally.ts'
import * as MakeRequireAvailableGlobally from '../MakeRequireAvailableGlobally/MakeRequireAvailableGlobally.ts'
import { monkeyPatchElectronHeadlessMode } from '../MonkeyPatchElectronHeadlessMode/MonkeyPatchElectronHeadlessMode.ts'
import * as MonkeyPatchElectronScript from '../MonkeyPatchElectronScript/MonkeyPatchElectronScript.ts'
import { VError } from '../VError/VError.ts'

interface RpcConnection {
  dispose(): Promise<void>
  invoke(method: string, params?: unknown): Promise<unknown>
  once(event: string): Promise<{ params: { callFrames: Array<{ callFrameId: string }> } }>
}

const waitForDebuggerToBePaused = async (rpc: RpcConnection) => {
  try {
    const msg = await rpc.once(DevtoolsEventType.DebuggerPaused)
    return msg
  } catch (error) {
    throw new VError(error, `Failed to wait for debugger`)
  }
}

const SOCKET_PATH = '/tmp/function-tracker-socket'

const protocolInterceptorScript = (socketPath: string): string => {
  return `function() {
  const electron = this
  const { protocol } = electron
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

export const connectElectron = async (electronRpc: RpcConnection, headlessMode: boolean, trackFunctions: boolean) => {
  const debuggerPausedPromise = waitForDebuggerToBePaused(electronRpc)
  await Promise.all([
    DevtoolsProtocolDebugger.enable(electronRpc),
    DevtoolsProtocolRuntime.enable(electronRpc),
    DevtoolsProtocolRuntime.runIfWaitingForDebugger(electronRpc),
  ])
  const msg = await debuggerPausedPromise
  const callFrame = msg.params.callFrames[0]
  const { callFrameId } = callFrame

  const electron = await DevtoolsProtocolDebugger.evaluateOnCallFrame(electronRpc, {
    callFrameId,
    expression: `require('electron')`,
    generatePreview: true,
    includeCommandLineAPI: true,
  })
  const require = await DevtoolsProtocolDebugger.evaluateOnCallFrame(electronRpc, {
    callFrameId,
    expression: `require`,
    generatePreview: true,
    includeCommandLineAPI: true,
  })

  const electronObjectId = electron.result.result.objectId
  const requireObjectId = require.result.result.objectId

  // TODO headlessmode

  const monkeyPatchedElectron = await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
    functionDeclaration: MonkeyPatchElectronScript.monkeyPatchElectronScript,
    objectId: electronObjectId,
  })

  if (headlessMode) {
    await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
      functionDeclaration: monkeyPatchElectronHeadlessMode,
      objectId: electronObjectId,
    })
  }

  await Promise.all([
    MakeElectronAvailableGlobally.makeElectronAvailableGlobally(electronRpc, electronObjectId),
    MakeRequireAvailableGlobally.makeRequireAvailableGlobally(electronRpc, requireObjectId),
  ])

  // Note: Protocol interceptor is NOT injected here because protocol.interceptBufferProtocol
  // can only be called when app is ready. It will be injected in ConnectFunctionTracker
  // after the monkey patch is undone (which happens when app becomes ready).

  await DevtoolsProtocolRuntime.runIfWaitingForDebugger(electronRpc)

  return {
    electronObjectId,
    monkeyPatchedElectronId: monkeyPatchedElectron.objectId,
  }
}
