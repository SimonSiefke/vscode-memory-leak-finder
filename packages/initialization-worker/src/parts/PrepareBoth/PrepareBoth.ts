import type { MessagePort } from 'node:worker_threads'
import { connectDevtools } from '../ConnectDevtools/ConnectDevtools.ts'
import { connectElectron } from '../ConnectElectron/ConnectElectron.ts'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as DebuggerCreateRpcConnection from '../DebuggerCreateRpcConnection/DebuggerCreateRpcConnection.ts'
import * as ElectronRpcState from '../ElectronRpcState/ElectronRpcState.ts'
import { DevtoolsProtocolDebugger, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as MonkeyPatchElectronScript from '../MonkeyPatchElectronScript/MonkeyPatchElectronScript.ts'
import { PortReadStream } from '../PortReadStream/PortReadStream.ts'
import * as WaitForDebuggerListening from '../WaitForDebuggerListening/WaitForDebuggerListening.ts'
import * as WaitForDevtoolsListening from '../WaitForDevtoolsListening/WaitForDevtoolsListening.ts'

export const prepareBoth = async (
  headlessMode: boolean,
  attachedToPageTimeout: number,
  port: MessagePort,
  parsedVersion: any,
  trackFunctions: boolean,
  connectionId: number,
  measureId: string,
  pid: number,
): Promise<any> => {
  const stream = new PortReadStream(port)
  const webSocketUrl = await WaitForDebuggerListening.waitForDebuggerListening(stream)

  const devtoolsWebSocketUrlPromise = WaitForDevtoolsListening.waitForDevtoolsListening(stream)

  const electronIpc = await DebuggerCreateIpcConnection.createConnection(webSocketUrl)
  const electronRpc = DebuggerCreateRpcConnection.createRpc(electronIpc)

  const { electronObjectId, monkeyPatchedElectronId } = await connectElectron(electronRpc, headlessMode, trackFunctions)

  await DevtoolsProtocolDebugger.resume(electronRpc)

  const devtoolsWebSocketUrl = await devtoolsWebSocketUrlPromise

  const connectDevtoolsPromise = connectDevtools(devtoolsWebSocketUrl, attachedToPageTimeout)

  if (headlessMode) {
    // TODO
  }

  // Store electronRpc in state so ConnectFunctionTracker can access it when tracking
  ElectronRpcState.setElectronRpc(electronRpc, monkeyPatchedElectronId)

  // If tracking, inject protocol interceptor BEFORE undoing monkey patch
  // This ensures it's ready as soon as app becomes ready
  if (trackFunctions) {
    try {
      const electronGlobal = await DevtoolsProtocolRuntime.evaluate(electronRpc, {
        expression: 'globalThis._____electron',
        returnByValue: false,
      })

      const objectId = electronGlobal?.objectId || electronGlobal?.result?.objectId || electronGlobal?.result?.result?.objectId

      if (objectId) {
        const protocolInterceptorScript = `function() {
          const electron = this
          const { protocol, app, BrowserWindow } = electron
          
          // Set up protocol interceptor - will be called when app becomes ready
          const setupInterceptor = () => {
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
          }

          // Set up interceptor immediately if app is ready, otherwise wait for ready event
          if (app.isReady()) {
            setupInterceptor()
          } else {
            app.once('ready', setupInterceptor)
          }
        }`

        await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
          functionDeclaration: protocolInterceptorScript,
          objectId: objectId,
        })
        console.log('[PrepareBoth] Injected protocol interceptor before app becomes ready')
      }
    } catch (error) {
      console.error('[PrepareBoth] Error injecting protocol interceptor:', error)
    }
  }

  // Always undo monkey patch immediately to allow page creation
  // When tracking, we'll pause again after function-tracker is connected
  await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
    functionDeclaration: MonkeyPatchElectronScript.undoMonkeyPatch,
    objectId: monkeyPatchedElectronId,
  })

  if (!trackFunctions) {
    // If not tracking, dispose electronRpc immediately
    await electronRpc.dispose()
    ElectronRpcState.clearElectronRpc()
  }

  // Wait for the page to be created by the initialization worker's connectDevtools
  const { dispose, sessionId, targetId } = await connectDevtoolsPromise

  // Dispose browserRpc from connectDevtools
  await dispose()

  return {
    devtoolsWebSocketUrl,
    electronObjectId,
    monkeyPatchedElectronId,
    sessionId,
    targetId,
    utilityContext: undefined,
    webSocketUrl,
  }
}
