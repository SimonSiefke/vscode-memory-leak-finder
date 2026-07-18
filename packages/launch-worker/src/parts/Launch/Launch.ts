import { join } from 'node:path'
import { createPipeline } from '../CreatePipeline/CreatePipeline.ts'
import * as CallgrindConfig from '../CallgrindConfig/CallgrindConfig.ts'
import * as CpuPerformanceCountersFromStart from '../CpuPerformanceCountersFromStart/CpuPerformanceCountersFromStart.ts'
import * as Disposables from '../Disposables/Disposables.ts'
import * as GetBinaryPath from '../GetBinaryPath/GetBinaryPath.ts'
import * as GetUserDataDir from '../GetUserDataDir/GetUserDataDir.ts'
import * as LaunchIde from '../LaunchIde/LaunchIde.ts'
import { launchInitializationWorker } from '../LaunchInitializationWorker/LaunchInitializationWorker.ts'
import * as PrepareTrackedVscode from '../PrepareTrackedVscode/PrepareTrackedVscode.ts'

export interface LaunchOptions {
  readonly arch: string
  readonly attachedToPageTimeout: number
  readonly buildVscodeMinified: boolean
  readonly canUseIdleCallback: boolean
  readonly clearExtensions: boolean
  readonly commit: string
  readonly connectionId: number
  readonly cwd: string
  readonly downloadUserDataZipFileToken: string
  readonly downloadUserDataZipFileUrl: string
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
  readonly openDevtools: boolean
  readonly platform: string
  readonly preparedVscodePath: string
  readonly proxyTestFolderName: string
  readonly trackFunctions: boolean
  readonly updateUrl: string
  readonly useProxyMock: boolean
  readonly vscodePath: string
  readonly vscodeVersion: string
}

let proxyWorkerRpc: any = null

export const getTrackingMode = (measureId: string): string => {
  if (measureId === 'tracked-everything' || measureId === 'trackedEverything') {
    return 'everything'
  }
  if (measureId === 'tracked-timeouts' || measureId === 'trackedTimeouts') {
    return 'timeouts'
  }
  if (
    measureId === 'tracked-allocations' ||
    measureId === 'trackedAllocations' ||
    measureId === 'tracked-allocations-from-start' ||
    measureId === 'trackedAllocationsFromStart' ||
    measureId === 'tracked-allocation-timeline' ||
    measureId === 'trackedAllocationTimeline'
  ) {
    return 'allocations'
  }
  return 'functions'
}

export const getSecretsPath = (): string => {
  const userDataDir = GetUserDataDir.getUserDataDir()
  return join(userDataDir, 'secrets', 'secrets.json')
}

export const launch = async (options: LaunchOptions): Promise<any> => {
  const {
    arch,
    attachedToPageTimeout,
    buildVscodeMinified,
    clearExtensions,
    commit,
    connectionId,
    cwd,
    downloadUserDataZipFileToken,
    downloadUserDataZipFileUrl,
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
    measureId,
    openDevtools,
    platform,
    preparedVscodePath,
    proxyTestFolderName,
    trackFunctions,
    updateUrl,
    useProxyMock,
    vscodePath,
    vscodeVersion,
  } = options
  const cpuPerformanceCountersFromStartConfig = CpuPerformanceCountersFromStart.getConfig(measureId, connectionId)
  const trackingMode = getTrackingMode(measureId)
  const {
    child,
    parsedVersion,
    pid,
    proxyWorkerRpc: currentProxyWorkerRpc,
  } = await LaunchIde.launchIde({
    addDisposable: Disposables.add,
    arch,
    buildVscodeMinified,
    callgrindConfig: CallgrindConfig.getCallgrindConfig(measureId, connectionId),
    clearExtensions,
    commit,
    cpuPerformanceCountersFromStartConfig,
    cwd,
    downloadUserDataZipFileToken,
    downloadUserDataZipFileUrl,
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
    platform,
    preparedVscodePath,
    proxyTestFolderName,
    trackFunctions,
    trackingMode,
    updateUrl,
    useProxyMock,
    vscodePath,
    vscodeVersion,
  })
  proxyWorkerRpc = currentProxyWorkerRpc || null
  // TODO maybe can do the intialization also here, without needing a separate worker
  await using port = createPipeline(child.stderr)

  const secretsPath = getSecretsPath()

  await using rpc = await launchInitializationWorker()
  if (pid === undefined) {
    throw new Error(`pid is undefined after launching IDE`)
  }
  const {
    devtoolsWebSocketUrl,
    electronObjectId,
    pid: electronPid,
    sessionId,
    targetId,
    utilityContext,
    webSocketUrl,
  } = await rpc.invokeAndTransfer(
    'Initialize.prepare',
    secretsPath,
    headlessMode,
    attachedToPageTimeout,
    port.port,
    parsedVersion,
    trackFunctions,
    openDevtools,
    connectionId,
    measureId,
    pid,
  )

  return {
    devtoolsWebSocketUrl,
    electronObjectId,
    parsedVersion,
    pid: typeof electronPid === 'number' ? electronPid : pid,
    sessionId,
    targetId,
    utilityContext,
    webSocketUrl,
  }
}

export const prepareTrackedVscode = async ({
  arch,
  buildVscodeMinified,
  commit,
  insidersCommit,
  measureId,
  platform,
  updateUrl,
  vscodePath,
  vscodeVersion,
}: {
  readonly arch: string
  readonly buildVscodeMinified: boolean
  readonly commit: string
  readonly insidersCommit: string
  readonly measureId: string
  readonly platform: string
  readonly updateUrl: string
  readonly vscodePath: string
  readonly vscodeVersion: string
}): Promise<string> => {
  const binaryPath = await GetBinaryPath.getBinaryPath(
    platform,
    arch,
    vscodeVersion,
    vscodePath,
    commit,
    insidersCommit,
    updateUrl,
    buildVscodeMinified,
  )
  return PrepareTrackedVscode.prepareTrackedVscode(binaryPath, getTrackingMode(measureId))
}

export const setup = async ({
  arch,
  buildVscodeMinified,
  clearExtensions,
  commit,
  cwd,
  downloadUserDataZipFileToken,
  downloadUserDataZipFileUrl,
  enableExtensions,
  enableProxy,
  ide,
  insidersCommit,
  inspectExtensions,
  inspectExtensionsPort,
  inspectPtyHost,
  inspectPtyHostPort,
  inspectSharedProcess,
  inspectSharedProcessPort,
  platform,
  updateUrl,
  useProxyMock,
  vscodePath,
  vscodeVersion,
}: {
  arch: string
  buildVscodeMinified: boolean
  clearExtensions: boolean
  commit: string
  cwd: string
  downloadUserDataZipFileToken: string
  downloadUserDataZipFileUrl: string
  enableExtensions: boolean
  enableProxy: boolean
  ide: string
  insidersCommit: string
  inspectExtensions: boolean
  inspectExtensionsPort: number
  inspectPtyHost: boolean
  inspectPtyHostPort: number
  inspectSharedProcess: boolean
  inspectSharedProcessPort: number
  platform: string
  updateUrl: string
  useProxyMock: boolean
  vscodePath: string
  vscodeVersion: string
}): Promise<void> => {
  await LaunchIde.setupIde({
    arch,
    buildVscodeMinified,
    clearExtensions,
    commit,
    cwd,
    downloadUserDataZipFileToken,
    downloadUserDataZipFileUrl,
    enableExtensions,
    enableProxy,
    ide,
    insidersCommit,
    inspectExtensions,
    inspectExtensionsPort,
    inspectPtyHost,
    inspectPtyHostPort,
    inspectSharedProcess,
    inspectSharedProcessPort,
    platform,
    updateUrl,
    useProxyMock,
    vscodePath,
    vscodeVersion,
  })
}

export const setProxyTestFolderName = async (proxyTestFolderName: string): Promise<void> => {
  if (!proxyWorkerRpc) {
    return
  }
  await proxyWorkerRpc.invoke('Proxy.setTestFolderName', proxyTestFolderName)
}
