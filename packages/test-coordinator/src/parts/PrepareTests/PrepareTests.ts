import * as CanUseIdleCallback from '../CanUseIdleCallback/CanUseIdleCallback.ts'
import * as KillExistingIdeInstances from '../KillExistingIdeInstances/KillExistingIdeInstances.ts'
import { prepareBoth } from '../PrepareBoth/PrepareBoth.ts'
import { createHttpProxyServer } from '../../../../page-object/src/parts/NetworkInterceptor/HttpProxyServer.ts'
import * as ProxyState from '../../../../page-object/src/parts/NetworkInterceptor/ProxyState.ts'
import * as Disposables from '../Disposables/Disposables.ts'

// Keep proxy server alive for the duration of tests
let globalProxyServer: { port: number; url: string; dispose: () => Promise<void> } | null = null

export const prepareTests = async (
  cwd: string,
  headlessMode: boolean,
  recordVideo: boolean,
  connectionId: number,
  timeouts: any,
  ide: string,
  ideVersion: string,
  vscodePath: string,
  vscodeVersion: string,
  commit: string,
  attachedToPageTimeout: number,
  measureId: string,
  idleTimeout: number,
  pageObjectPath: string,
  runMode: number,
  inspectSharedProcess: boolean,
  inspectExtensions: boolean,
  inspectPtyHost: boolean,
  enableExtensions: boolean,
  inspectPtyHostPort: number,
  inspectSharedProcessPort: number,
  inspectExtensionsPort: number,
  enableProxy: boolean,
) => {
  const isFirstConnection = true
  const canUseIdleCallback = CanUseIdleCallback.canUseIdleCallback(headlessMode)
  await KillExistingIdeInstances.killExisingIdeInstances(ide)

  // Start proxy server before launching VS Code if enabled
  if (enableProxy) {
    console.log('[PrepareTests] Starting proxy server...')
    globalProxyServer = await createHttpProxyServer(0)
    console.log(`[PrepareTests] Proxy server started on ${globalProxyServer.url} (port ${globalProxyServer.port})`)

    // Store proxy server reference to keep it alive
    Disposables.add(async () => {
      if (globalProxyServer) {
        console.log('[PrepareTests] Disposing proxy server...')
        await globalProxyServer.dispose()
        globalProxyServer = null
      }
    })

    await ProxyState.setProxyState({
      proxyUrl: globalProxyServer.url,
      port: globalProxyServer.port,
    })
    console.log(`[PrepareTests] Proxy state saved to .vscode-proxy-state.json`)

    // Wait a bit to ensure proxy server is fully ready
    await new Promise(resolve => setTimeout(resolve, 100))

    // Test that proxy server is listening
    const { createConnection } = await import('net')
    await new Promise<void>((resolve, reject) => {
      const testSocket = createConnection(globalProxyServer!.port, '127.0.0.1', () => {
        testSocket.destroy()
        console.log(`[PrepareTests] Proxy server is listening and accepting connections on port ${globalProxyServer!.port}`)
        resolve()
      })
      testSocket.on('error', (error) => {
        console.error(`[PrepareTests] Proxy server connection test failed:`, error)
        reject(error)
      })
      setTimeout(() => {
        testSocket.destroy()
        reject(new Error('Proxy server connection test timeout'))
      }, 2000)
    }).catch((error) => {
      console.error(`[PrepareTests] Warning: Could not verify proxy server:`, error)
    })
  }

  const { webSocketUrl, devtoolsWebSocketUrl, electronObjectId, parsedVersion, utilityContext, initializationWorkerRpc } =
    await prepareBoth(
      headlessMode,
      cwd,
      ide,
      vscodePath,
      vscodeVersion,
      commit,
      connectionId,
      isFirstConnection,
      canUseIdleCallback,
      attachedToPageTimeout,
      inspectSharedProcess,
      inspectExtensions,
      inspectPtyHost,
      enableExtensions,
      inspectPtyHostPort,
      inspectSharedProcessPort,
      inspectExtensionsPort,
    )

  return {
    parsedVersion,
    utilityContext,
    webSocketUrl,
    devtoolsWebSocketUrl,
    electronObjectId,
    initializationWorkerRpc,
  }
}
