import { connectWorkers } from '../ConnectWorkers/ConnectWorkers.ts'
import * as PrepareTests from '../PrepareTests/PrepareTests.ts'

interface State {
  promise: Promise<any> | undefined
}

export const state: State = {
  promise: undefined,
}

export interface PrepareTestsAndAttachOptions {
  readonly attachedToPageTimeout: number
  readonly clearExtensions: boolean
  readonly commit: string
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
  readonly recordVideo: boolean
  readonly runMode: number
  readonly screencastQuality: number
  readonly timeouts: any
  readonly useProxyMock: boolean
  readonly vscodePath: string
  readonly vscodeVersion: string
}

export const prepareTestsAndAttach = async (options: PrepareTestsAndAttachOptions) => {
  const {
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
    measureNode,
    pageObjectPath,
    recordVideo,
    runMode,
    screencastQuality,
    timeouts,
    useProxyMock,
    vscodePath,
    vscodeVersion,
  } = options
  const isFirst = state.promise === undefined
  if (isFirst) {
    state.promise = PrepareTests.prepareTests({
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
      recordVideo,
      runMode,
      timeouts,
      useProxyMock,
      vscodePath,
      vscodeVersion,
    })
  }
  const result = await state.promise

  const { devtoolsWebSocketUrl, electronObjectId, initializationWorkerRpc, parsedVersion, utilityContext, webSocketUrl } = await result

  const { memoryRpc, testWorkerRpc, videoRpc } = await connectWorkers(
    recordVideo,
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
    initializationWorkerRpc,
    memoryRpc,
    testWorkerRpc,
    videoRpc,
  }
}
