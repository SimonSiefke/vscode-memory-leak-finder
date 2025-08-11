import * as Assert from '../Assert/Assert.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'

/**
 *
 * @param {*} rpc
 * @param {*} connectionId
 * @param {string} devtoolsWebSocketUrl
 * @param {string} monkeyPatchedElectronId
 * @param {string} electronObjectId
 * @param {boolean} isFirstConnection
 * @param {boolean} headlessMode
 * @param {string} webSocketUrl
 * @param {boolean} canUseIdleCallback
 * @returns
 */
export const connectDevtools = (
  rpc,
  connectionId,
  devtoolsWebSocketUrl,
  monkeyPatchedElectronId,
  electronObjectId,
  isFirstConnection,
  headlessMode,
  webSocketUrl,
  canUseIdleCallback,
) => {
  Assert.object(rpc)
  Assert.number(connectionId)
  Assert.string(devtoolsWebSocketUrl)
  return rpc.invoke(
    TestWorkerCommandType.ConnectDevtools,
    connectionId,
    devtoolsWebSocketUrl,
    monkeyPatchedElectronId,
    electronObjectId,
    isFirstConnection,
    headlessMode,
    webSocketUrl,
    canUseIdleCallback,
  )
}
