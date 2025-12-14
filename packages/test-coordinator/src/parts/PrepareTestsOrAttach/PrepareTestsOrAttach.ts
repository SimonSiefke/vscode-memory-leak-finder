import { connectWorkers } from '../ConnectWorkers/ConnectWorkers.ts'
import * as PrepareTests from '../PrepareTests/PrepareTests.ts'

interface State {
  promise: Promise<any> | undefined
}

export const state: State = {
  promise: undefined,
}

export interface PrepareTestsAndAttachOptions {
  readonly cwd: string
  readonly headlessMode: boolean
  readonly recordVideo: boolean
  readonly connectionId: number
  readonly timeouts: any
  readonly runMode: number
  readonly ide: string
  readonly ideVersion: string
  readonly vscodePath: string
  readonly vscodeVersion: string
  readonly commit: string
  readonly insidersCommit: string
  readonly attachedToPageTimeout: number
  readonly measureId: string
  readonly idleTimeout: number
  readonly pageObjectPath: string
  readonly measureNode: boolean
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

export const prepareTestsAndAttach = async (options: PrepareTestsAndAttachOptions) => {
  const {
    cwd,
    headlessMode,
    recordVideo,
    connectionId,
    timeouts,
    runMode,
    ide,
    ideVersion,
    vscodePath,
    vscodeVersion,
    commit,
    insidersCommit,
    attachedToPageTimeout,
    measureId,
    idleTimeout,
    pageObjectPath,
    measureNode,
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
  const isFirst = state.promise === undefined
  if (isFirst) {
    state.promise = PrepareTests.prepareTests({
      cwd,
      headlessMode,
      recordVideo,
      connectionId,
      timeouts,
      ide,
      ideVersion,
      vscodePath,
      vscodeVersion,
      commit,
      insidersCommit,
      attachedToPageTimeout,
      measureId,
      idleTimeout,
      pageObjectPath,
      runMode,
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
  }
  const result = await state.promise

  const { webSocketUrl, devtoolsWebSocketUrl, electronObjectId, parsedVersion, utilityContext, initializationWorkerRpc } = await result

  const { memoryRpc, testWorkerRpc, videoRpc } = await connectWorkers(
    recordVideo,
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
    memoryRpc,
    testWorkerRpc,
    videoRpc,
    initializationWorkerRpc,
  }
}
