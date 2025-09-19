import * as CanUseIdleCallback from '../CanUseIdleCallback/CanUseIdleCallback.ts'
import * as ConnectDevtools from '../ConnectDevtools/ConnectDevtools.ts'
import * as LaunchTestWorker from '../LaunchTestWorker/LaunchTestWorker.ts'
import * as PrepareTests from '../PrepareTests/PrepareTests.ts'

interface State {
  firstLaunch: boolean
  devtoolsWebSocketUrl: string
  webSocketUrl: string
  connectionId: number
  headlessMode: boolean
  parsedVersion: any
  promise: Promise<any> | undefined
  utilityContext: Promise<any> | undefined
}

export const state: State = {
  firstLaunch: false,
  devtoolsWebSocketUrl: '',
  webSocketUrl: '',
  connectionId: 0,
  headlessMode: false,
  parsedVersion: null,
  /**
   * @type {Promise|undefined}
   */
  promise: undefined,
  utilityContext: undefined,
}

export const prepareTestsOrAttach = async (
  cwd: string,
  headlessMode: boolean,
  recordVideo: boolean,
  connectionId: number,
  timeouts: any,
  runMode: number,
  ide: string,
  ideVersion: string,
  vscodePath: string,
  commit: string,
  attachedToPageTimeout: number,
  measureId: string,
  idleTimeout: number,
  pageObjectPath: string,
) => {
  const isFirst = state.promise === undefined
  if (isFirst) {
    state.promise = PrepareTests.prepareTests(
      cwd,
      headlessMode,
      recordVideo,
      connectionId,
      timeouts,
      ide,
      ideVersion,
      vscodePath,
      commit,
      attachedToPageTimeout,
      measureId,
      idleTimeout,
      pageObjectPath,
      runMode,
    )
    const result = await state.promise
    state.parsedVersion = result.parsedVersion
    state.utilityContext = result.utilityContext
    return {
      testWorkerRpc,
      memoryRpc: result.memoryRpc,
      videoRpc: result.videoRpc,
    }
  }
  const { webSocketUrl, devtoolsWebSocketUrl, electronObjectId, parsedVersion, utilityContext, sessionId, targetId } = await state.promise
  const isFirstConnection = false
  const canUseIdleCallback = CanUseIdleCallback.canUseIdleCallback(headlessMode)
  await ConnectDevtools.connectDevtools(
    testWorkerRpc,
    connectionId,
    devtoolsWebSocketUrl,
    electronObjectId,
    isFirstConnection,
    headlessMode,
    webSocketUrl,
    canUseIdleCallback,
    idleTimeout,
    pageObjectPath,
    headlessMode,
    parsedVersion,
    timeouts,
    utilityContext,
    sessionId,
    targetId,
  )
  return testWorkerRpc
}
