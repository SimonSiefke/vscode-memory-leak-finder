import * as ConnectDevtools from '../ConnectDevtools/ConnectDevtools.js'
import * as ConnectElectron from '../ConnectElectron/ConnectElectron.js'
import * as PageObject from '../PageObject/PageObject.js'
import * as CanUseIdleCallback from '../CanUseIdleCallback/CanUseIdleCallback.js'
import * as PrepareTests from '../PrepareTests/PrepareTests.js'
import * as TestWorker from '../TestWorker/TestWorker.js'

export const state = {
  firstLaunch: false,
  devtoolsWebSocketUrl: '',
  webSocketUrl: '',
  connectionId: 0,
  headlessMode: false,
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
  const testWorkerIpc = await TestWorker.launch(runMode)
  const isFirst = state.promise === undefined
  if (isFirst) {
    state.promise = PrepareTests.prepareTests(
      testWorkerIpc,
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
    await state.promise
    return testWorkerIpc
  }
  const { webSocketUrl, devtoolsWebSocketUrl, electronObjectId, callFrameId, monkeyPatchedElectron } = await state.promise
  const isFirstConnection = false
  const canUseIdleCallback = CanUseIdleCallback.canUseIdleCallback(headlessMode)
  await ConnectElectron.connectElectron(testWorkerIpc, connectionId, headlessMode, webSocketUrl, isFirstConnection, canUseIdleCallback)
  await ConnectDevtools.connectDevtools(
    testWorkerIpc,
    connectionId,
    devtoolsWebSocketUrl,
    monkeyPatchedElectron,
    electronObjectId,
    callFrameId,
    isFirstConnection,
  )
  await PageObject.create(testWorkerIpc, connectionId, isFirstConnection, headlessMode, timeouts, ideVersion)
  return testWorkerIpc
}
