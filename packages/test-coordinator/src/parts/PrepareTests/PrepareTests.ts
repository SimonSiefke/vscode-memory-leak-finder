import * as CanUseIdleCallback from '../CanUseIdleCallback/CanUseIdleCallback.ts'
import * as KillExistingIdeInstances from '../KillExistingIdeInstances/KillExistingIdeInstances.ts'
import { prepareBoth } from '../PrepareBoth/PrepareBoth.ts'
import * as ProxyState from '../../../../page-object/src/parts/NetworkInterceptor/ProxyState.ts'
import * as Root from '../Root/Root.ts'
import { join } from 'path'

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

  // If proxy is enabled, create proxy state file to signal LaunchVsCode to start proxy server
  if (enableProxy) {
    await ProxyState.setProxyState({
      proxyUrl: '', // Empty URL signals that proxy should be started
      port: null,
    })
    console.log('[PrepareTests] Proxy enabled - LaunchVsCode will start proxy server')
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
