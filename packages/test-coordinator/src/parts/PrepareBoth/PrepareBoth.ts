import { launchInitializationWorker } from '../LaunchInitializationWorker/LaunchInitializationWorker.ts'

export interface PrepareBothResult {
  readonly webSocketUrl: string
  readonly devtoolsWebSocketUrl: string
  readonly electronObjectId: string
  readonly parsedVersion: string
  readonly utilityContext: any
  readonly sessionId: string
  readonly targetId: string
  readonly initializationWorkerRpc: any
}

export interface PrepareBothOptions {
  readonly headlessMode: boolean
  readonly cwd: string
  readonly ide: string
  readonly vscodePath: string
  readonly vscodeVersion: string
  readonly commit: string
  readonly insidersCommit: string
  readonly connectionId: number
  readonly isFirstConnection: boolean
  readonly canUseIdleCallback: boolean
  readonly attachedToPageTimeout: number
  readonly inspectSharedProcess: boolean
  readonly inspectExtensions: boolean
  readonly inspectPtyHost: boolean
  readonly enableExtensions: boolean
  readonly inspectPtyHostPort: number
  readonly inspectSharedProcessPort: number
  readonly inspectExtensionsPort: number
  readonly enableProxy: boolean
  readonly useProxyMock: boolean
}

export const prepareBoth = async (options: PrepareBothOptions): Promise<PrepareBothResult> => {
  const {
    headlessMode,
    cwd,
    ide,
    vscodePath,
    vscodeVersion,
    commit,
    insidersCommit,
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
    enableProxy,
    useProxyMock,
  } = options
  const initializationWorkerRpc = await launchInitializationWorker()
  const { webSocketUrl, devtoolsWebSocketUrl, electronObjectId, parsedVersion, utilityContext, sessionId, targetId } =
    await initializationWorkerRpc.invoke('Launch.launch', {
      headlessMode,
      cwd,
      ide,
      vscodePath,
      vscodeVersion,
      commit,
      insidersCommit,
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
      enableProxy,
      useProxyMock,
    })
  return {
    initializationWorkerRpc,
    webSocketUrl,
    devtoolsWebSocketUrl,
    electronObjectId,
    parsedVersion,
    utilityContext,
    sessionId,
    targetId,
  }
}
