import * as ElectronRpcState from '../ElectronRpcState/ElectronRpcState.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as MonkeyPatchElectronScript from '../MonkeyPatchElectronScript/MonkeyPatchElectronScript.ts'

const protocolInterceptorScript = (): string => {
  return `function() {
  const electron = this
  const { protocol, app } = electron
  // Wait for app to be ready before intercepting protocol
  if (!app.isReady()) {
    console.error('[ProtocolInterceptor] App is not ready yet')
    return
  }
  
  // Intercept all vscode-file protocol requests and return <h1>hello world</h1>
  protocol.interceptBufferProtocol('vscode-file', (request, callback) => {
    console.log('[ProtocolInterceptor] Intercepting vscode-file request:', request.url)
    const html = '<h1>hello world</h1>'
    callback({
      data: Buffer.from(html, 'utf8'),
      mimeType: 'text/html',
    })
  })
  
  console.log('[ProtocolInterceptor] Protocol interceptor installed')
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
        functionDeclaration: protocolInterceptorScript(),
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
