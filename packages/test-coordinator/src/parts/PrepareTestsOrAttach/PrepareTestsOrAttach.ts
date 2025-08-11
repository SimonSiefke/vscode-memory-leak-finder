import * as ConnectDevtools from '../ConnectDevtools/ConnectDevtools.js'
import * as ConnectElectron from '../ConnectElectron/ConnectElectron.js'
import * as PageObject from '../PageObject/PageObject.js'
import * as CanUseIdleCallback from '../CanUseIdleCallback/CanUseIdleCallback.js'
import * as PrepareTests from '../PrepareTests/PrepareTests.js'
import * as LaunchTestWorker from '../LaunchTestWorker/LaunchTestWorker.js'
import * as GetPageObjectPath from '../GetPageObjectPath/GetPageObjectPath.js'

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
  cwd,
  headlessMode,
  recordVideo,
  connectionId,
  timeouts,
  runMode,
  ide,
  ideVersion,
  vscodePath,
  commit,
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
    )
    const result = await state.promise
    state.parsedVersion = result.parsedVersion
    return testWorkerRpc
  }
  const { webSocketUrl, devtoolsWebSocketUrl, electronObjectId, monkeyPatchedElectron } = await state.promise
  const isFirstConnection = false
  const canUseIdleCallback = CanUseIdleCallback.canUseIdleCallback(headlessMode)
  await ConnectElectron.connectElectron(testWorkerRpc, connectionId, headlessMode, webSocketUrl, isFirstConnection, canUseIdleCallback)
  await ConnectDevtools.connectDevtools(
    testWorkerRpc,
    connectionId,
    devtoolsWebSocketUrl,
    monkeyPatchedElectron,
    electronObjectId,
    isFirstConnection,
    headlessMode,
    webSocketUrl,
    canUseIdleCallback,
  )
  await PageObject.create(testWorkerRpc, connectionId, isFirstConnection, headlessMode, timeouts, state.parsedVersion, pageObjectPath)
  return testWorkerRpc
}
