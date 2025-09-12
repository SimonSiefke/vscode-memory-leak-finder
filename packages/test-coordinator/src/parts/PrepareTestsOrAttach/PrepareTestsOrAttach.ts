import * as CanUseIdleCallback from '../CanUseIdleCallback/CanUseIdleCallback.ts'
import * as ConnectDevtools from '../ConnectDevtools/ConnectDevtools.ts'
import * as GetPageObjectPath from '../GetPageObjectPath/GetPageObjectPath.ts'
import * as LaunchTestWorker from '../LaunchTestWorker/LaunchTestWorker.ts'
import * as PageObject from '../PageObject/PageObject.ts'
import * as PrepareTests from '../PrepareTests/PrepareTests.ts'

interface State {
  firstLaunch: boolean
  devtoolsWebSocketUrl: string
  webSocketUrl: string
  connectionId: number
  headlessMode: boolean
  parsedVersion: any
  promise: Promise<any> | undefined
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
}

export const prepareTestsOrAttach = async (
  cwd: string,
  headlessMode: boolean,
  recordVideo: boolean,
  connectionId: number,
  timeouts: any,
  runMode: string,
  ide: string,
  ideVersion: string,
  vscodePath: string,
  commit: string,
  attachedToPageTimeout: number,
  idleTimeout: number,
) => {
  const pageObjectPath = GetPageObjectPath.getPageObjectPath()
  const testWorkerRpc = await LaunchTestWorker.launchTestWorker(runMode)
  const isFirst = state.promise === undefined
  if (isFirst) {
    state.promise = PrepareTests.prepareTests(
      testWorkerRpc,
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
      idleTimeout,
    )
    const result = await state.promise
    state.parsedVersion = result.parsedVersion
    return testWorkerRpc
  }
  const { webSocketUrl, devtoolsWebSocketUrl, electronObjectId } = await state.promise
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
  )
  await PageObject.create(testWorkerRpc, connectionId, isFirstConnection, headlessMode, timeouts, state.parsedVersion, pageObjectPath)
  return testWorkerRpc
}
