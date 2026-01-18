import * as ElectronRpcState from '../ElectronRpcState/ElectronRpcState.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as MonkeyPatchElectronScript from '../MonkeyPatchElectronScript/MonkeyPatchElectronScript.ts'

const protocolInterceptorScript = (): string => {
  return `function() {
  const electron = this
  const { protocol, app, BrowserWindow } = electron
  // Wait for app to be ready before intercepting protocol
  if (!app.isReady()) {
    console.error('[ProtocolInterceptor] App is not ready yet')
    return
  }

  // Intercept all vscode-file protocol requests and return <h1>hello world</h1>
  protocol.interceptBufferProtocol('vscode-file', (request, callback) => {
    console.log('[ProtocolInterceptor] Intercepting vscode-file request:', request.url)
    const html = \`<h1 style="color:red; font-size:200px; z-index:400;position:absolute">hello world</h1>\`
    callback({
      data: Buffer.from(html, 'utf8'),
      mimeType: 'text/html',
    })
  })

  // Open DevTools when window shows using setInterval
  const devToolsInterval = setInterval(() => {
    try {
      const focusedWindow = BrowserWindow.getFocusedWindow()
      if (focusedWindow && focusedWindow.webContents) {
        console.log('[ProtocolInterceptor] Found focused window, opening DevTools')
        focusedWindow.webContents.openDevTools()
        clearInterval(devToolsInterval)
      }
    } catch (error) {
      console.error('[ProtocolInterceptor] Error checking for focused window:', error)
    }
  }, 100)

  // Clear interval after 30 seconds to avoid infinite polling
  setTimeout(() => {
    clearInterval(devToolsInterval)
  }, 30000)

  console.log('[ProtocolInterceptor] Protocol interceptor installed')
}`
}

export const connectFunctionTracker = async (): Promise<void> => {
  const electronRpcState = ElectronRpcState.getElectronRpc()
  if (!electronRpcState) {
    throw new Error('electronRpc not found in state. Make sure PrepareBoth was called first.')
  }

  const { electronRpc, monkeyPatchedElectronId } = electronRpcState

  // Protocol interceptor is already injected in PrepareBoth before app becomes ready
  // Just dispose electronRpc here
  await electronRpc.dispose()
  ElectronRpcState.clearElectronRpc()
}
