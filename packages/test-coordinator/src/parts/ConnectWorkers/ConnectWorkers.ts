import * as ConnectDevtools from '../ConnectDevtools/ConnectDevtools.ts'
import * as MemoryLeakWorker from '../MemoryLeakWorker/MemoryLeakWorker.ts'
import * as VideoRecording from '../VideoRecording/VideoRecording.ts'

/**
 *
 * @param {*} rpc
 * @param {boolean} headlessMode
 * @param {boolean} recordVideo
 * @param {number} connectionId
 * @param {string} devtoolsWebSocketUrl
 * @param {string} webSocketUrl
 * @param {boolean} isFirstConnection
 * @param {boolean} canUseIdleCallback
 * @param {*} monkeyPatchedElectronId
 * @param {*} electronObjectId
 */
export const connectWorkers = async (
  rpc,
  headlessMode,
  recordVideo,
  connectionId,
  devtoolsWebSocketUrl,
  webSocketUrl,
  isFirstConnection,
  canUseIdleCallback,
  monkeyPatchedElectronId,
  electronObjectId,
) => {
  if (recordVideo) {
    await VideoRecording.start(devtoolsWebSocketUrl)
  }
  await MemoryLeakWorker.startWorker(devtoolsWebSocketUrl)
  await ConnectDevtools.connectDevtools(
    rpc,
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
