import { connectWorkers } from '../ConnectWorkers/ConnectWorkers.ts'
import * as PrepareTests from '../PrepareTests/PrepareTests.ts'

interface State {
  promise: Promise<any> | undefined
}

export const state: State = {
  promise: undefined,
}

export interface PrepareTestsAndAttachOptions {
  readonly arch: string
  readonly attachedToPageTimeout: number
  readonly clearExtensions: boolean
  readonly commit: string
  readonly compressVideo: boolean
  readonly connectionId: number
  readonly cwd: string
  readonly enableExtensions: boolean
  readonly enableProxy: boolean
  readonly headlessMode: boolean
  readonly ide: string
  readonly ideVersion: string
  readonly idleTimeout: number
  readonly insidersCommit: string
  readonly inspectExtensions: boolean
  readonly inspectExtensionsPort: number
  readonly inspectPtyHost: boolean
  readonly inspectPtyHostPort: number
  readonly inspectSharedProcess: boolean
  readonly inspectSharedProcessPort: number
  readonly measureId: string
  readonly measureNode: boolean
  readonly pageObjectPath: string
  readonly platform: string
  readonly recordVideo: boolean
  readonly runMode: number
  readonly screencastQuality: number
  readonly timeouts: any
  readonly trackFunctions: boolean
  readonly updateUrl: string
  readonly useProxyMock: boolean
  readonly vscodePath: string
  readonly vscodeVersion: string
}

export const prepareTestsAndAttach = async (options: PrepareTestsAndAttachOptions) => {
  const {
    arch,
    attachedToPageTimeout,
    clearExtensions,
    commit,
    compressVideo,
    connectionId,
    cwd,
    enableExtensions,
    enableProxy,
    headlessMode,
    ide,
    ideVersion,
    idleTimeout,
    insidersCommit,
    inspectExtensions,
    inspectExtensionsPort,
    inspectPtyHost,
    inspectPtyHostPort,
    inspectSharedProcess,
    inspectSharedProcessPort,
    measureId,
    measureNode,
    pageObjectPath,
    platform,
    recordVideo,
    runMode,
    screencastQuality,
    timeouts,
    trackFunctions,
    updateUrl,
    useProxyMock,
    vscodePath,
    vscodeVersion,
  } = options
  const isFirst = state.promise === undefined
  if (isFirst) {
    state.promise = PrepareTests.prepareTests({
      arch,
      attachedToPageTimeout,
      clearExtensions,
      commit,
      connectionId,
      cwd,
      enableExtensions,
      enableProxy,
      headlessMode,
      ide,
      ideVersion,
      idleTimeout,
      insidersCommit,
      inspectExtensions,
      inspectExtensionsPort,
      inspectPtyHost,
      inspectPtyHostPort,
      inspectSharedProcess,
      inspectSharedProcessPort,
      measureId,
      pageObjectPath,
      platform,
      recordVideo,
      runMode,
      timeouts,
      trackFunctions,
      updateUrl,
      useProxyMock,
      vscodePath,
      vscodeVersion,
    })
  }
  const result = await state.promise

  const { devtoolsWebSocketUrl, electronObjectId, functionTrackerRpc, initializationWorkerRpc, parsedVersion, pid, utilityContext, webSocketUrl } = await result

  const { memoryRpc, testWorkerRpc, videoRpc } = await connectWorkers(
    platform,
    arch,
    recordVideo,
    compressVideo,
    screencastQuality,
    connectionId,
    devtoolsWebSocketUrl,
    webSocketUrl,
    electronObjectId,
    attachedToPageTimeout,
    measureId,
    idleTimeout,
    pageObjectPath,
    parsedVersion,
    pid,
    timeouts,
    utilityContext,
    runMode,
    measureNode,
    inspectSharedProcess,
    inspectExtensions,
    inspectPtyHost,
    enableExtensions,
    inspectPtyHostPort,
    inspectSharedProcessPort,
    inspectExtensionsPort,
  )
  return {
    functionTrackerRpc,
    initializationWorkerRpc,
    memoryRpc,
    testWorkerRpc,
    videoRpc,
  }
}
