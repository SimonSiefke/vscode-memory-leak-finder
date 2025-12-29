import { launchInitializationWorker } from '../LaunchInitializationWorker/LaunchInitializationWorker.ts'

export interface PrepareBothResult {
  readonly devtoolsWebSocketUrl: string
  readonly electronObjectId: string
  readonly initializationWorkerRpc: any
  readonly parsedVersion: string
  readonly sessionId: string
  readonly targetId: string
  readonly utilityContext: any
  readonly webSocketUrl: string
}

export interface PrepareBothOptions {
  readonly arch: string
  readonly attachedToPageTimeout: number
  readonly canUseIdleCallback: boolean
  readonly clearExtensions: boolean
  readonly commit: string
  readonly connectionId: number
  readonly cwd: string
  readonly enableExtensions: boolean
  readonly enableProxy: boolean
  readonly headlessMode: boolean
  readonly ide: string
  readonly insidersCommit: string
  readonly inspectExtensions: boolean
  readonly inspectExtensionsPort: number
  readonly inspectPtyHost: boolean
  readonly inspectPtyHostPort: number
  readonly inspectSharedProcess: boolean
  readonly inspectSharedProcessPort: number
  readonly isFirstConnection: boolean
  readonly platform: string
  readonly updateUrl: string
  readonly useProxyMock: boolean
  readonly vscodePath: string
  readonly vscodeVersion: string
}

export const prepareBoth = async (options: PrepareBothOptions): Promise<PrepareBothResult> => {
  const {
    arch,
    attachedToPageTimeout,
    canUseIdleCallback,
    clearExtensions,
    commit,
    connectionId,
    cwd,
    enableExtensions,
    enableProxy,
    headlessMode,
    ide,
    insidersCommit,
    inspectExtensions,
    inspectExtensionsPort,
    inspectPtyHost,
    inspectPtyHostPort,
    inspectSharedProcess,
    inspectSharedProcessPort,
    isFirstConnection,
    platform,
    updateUrl,
    useProxyMock,
    vscodePath,
    vscodeVersion,
  } = options
  const initializationWorkerRpc = await launchInitializationWorker()
  const { devtoolsWebSocketUrl, electronObjectId, parsedVersion, sessionId, targetId, utilityContext, webSocketUrl } =
    await initializationWorkerRpc.invoke('Launch.launch', {
      arch,
      attachedToPageTimeout,
      canUseIdleCallback,
      clearExtensions,
      commit,
      connectionId,
      cwd,
      enableExtensions,
      enableProxy,
      headlessMode,
      ide,
      insidersCommit,
      inspectExtensions,
      inspectExtensionsPort,
      inspectPtyHost,
      inspectPtyHostPort,
      inspectSharedProcess,
      inspectSharedProcessPort,
      isFirstConnection,
      platform,
      updateUrl,
      useProxyMock,
      vscodePath,
      vscodeVersion,
    })
  return {
    devtoolsWebSocketUrl,
    electronObjectId,
    initializationWorkerRpc,
    parsedVersion,
    sessionId,
    targetId,
    utilityContext,
    webSocketUrl,
  }
}
