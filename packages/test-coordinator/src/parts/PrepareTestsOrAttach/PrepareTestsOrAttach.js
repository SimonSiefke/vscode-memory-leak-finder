import * as ConnectDevtools from '../ConnectDevtools/ConnectDevtools.js'
import * as ConnectElectron from '../ConnectElectron/ConnectElectron.js'
import * as KillExistingVscodeInstances from '../KillExistingVscodeInstances/KillExistingVscodeInstances.js'
import * as LaunchVsCode from '../LaunchVsCode/LaunchVsCode.js'
import * as PageObject from '../PageObject/PageObject.js'
import * as TestWorker from '../TestWorker/TestWorker.js'
import * as WaitForDevtoolsListening from '../WaitForDevtoolsListening/WaitForDevtoolsListening.js'
import * as PrepareTests from '../PrepareTests/PrepareTests.js'

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

const createDevtoolsUrlPromise = async (childPromise) => {
  const { child } = await childPromise
  return WaitForDevtoolsListening.waitForDevtoolsListening(child.stderr)
}

export const prepareTestsOrAttach = async (cwd, headlessMode, connectionId) => {
  const ipc = await TestWorker.launch()
  const isFirst = state.promise === undefined
  if (isFirst) {
    state.promise = PrepareTests.prepareTests(ipc, cwd, headlessMode, connectionId)
    await state.promise
    return ipc
  }
  const { webSocketUrl, devtoolsWebSocketUrl, electronObjectId, callFrameId, monkeyPatchedElectron } = await state.promise
  await ConnectElectron.connectElectron(ipc, connectionId, headlessMode, webSocketUrl, false)
  await ConnectDevtools.connectDevtools(
    ipc,
    connectionId,
    devtoolsWebSocketUrl,
    monkeyPatchedElectron,
    electronObjectId,
    callFrameId,
    false,
  )
  return ipc
}
