import { launchInitializationWorker } from '../LaunchInitializationWorker/LaunchInitializationWorker.ts'

export interface PrepareBothResult {
  readonly devtoolsWebSocketUrl: string
  readonly electronObjectId: string
  readonly functionTrackerRpc: any
  readonly initializationWorkerRpc: any
  readonly parsedVersion: string
  readonly pid: number
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
  readonly measureId: string
  readonly platform: string
  readonly trackFunctions: boolean
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
    measureId,
    platform,
    trackFunctions,
    updateUrl,
    useProxyMock,
    vscodePath,
    vscodeVersion,
  } = options
  const initializationWorkerRpc = await launchInitializationWorker()
  const launchResult = await initializationWorkerRpc.invoke('Launch.launch', {
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
    measureId,
    platform,
    trackFunctions,
    updateUrl,
    useProxyMock,
    vscodePath,
    vscodeVersion,
  })
  const { devtoolsWebSocketUrl, electronObjectId, parsedVersion, pid, sessionId, targetId, utilityContext, webSocketUrl } = launchResult
  if (pid === undefined) {
    throw new Error(`pid is undefined in Launch.launch result. Result keys: ${Object.keys(launchResult).join(', ')}`)
  }
  return {
    devtoolsWebSocketUrl,
    electronObjectId,
    initializationWorkerRpc,
    parsedVersion,
    pid,
    sessionId,
    targetId,
    utilityContext,
    webSocketUrl,
  }
}
