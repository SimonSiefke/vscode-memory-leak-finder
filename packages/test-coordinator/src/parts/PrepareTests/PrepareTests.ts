import * as CanUseIdleCallback from '../CanUseIdleCallback/CanUseIdleCallback.ts'
import * as KillExistingIdeInstances from '../KillExistingIdeInstances/KillExistingIdeInstances.ts'
import { prepareBoth } from '../PrepareBoth/PrepareBoth.ts'
import { createHttpProxyServer } from '../../../../page-object/src/parts/NetworkInterceptor/HttpProxyServer.ts'
import * as ProxyState from '../../../../page-object/src/parts/NetworkInterceptor/ProxyState.ts'

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
    const proxyServer = await createHttpProxyServer(0)
    console.log(`[PrepareTests] Proxy server started on ${proxyServer.url} (port ${proxyServer.port})`)
    await ProxyState.setProxyState({
      proxyUrl: proxyServer.url,
      port: proxyServer.port,
    })
    console.log(`[PrepareTests] Proxy state saved to .vscode-proxy-state.json`)
    
    // Test that proxy server is accessible
    try {
      const testResponse = await fetch(`http://127.0.0.1:${proxyServer.port}`, {
        method: 'GET',
        signal: AbortSignal.timeout(1000),
      }).catch(() => null)
      console.log(`[PrepareTests] Proxy server test: ${testResponse ? 'accessible' : 'not responding (expected)'}`)
    } catch (error) {
      // Expected to fail - proxy needs a proper proxy request
      console.log(`[PrepareTests] Proxy server is listening on port ${proxyServer.port}`)
    }
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
