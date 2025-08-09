import * as CanUseIdleCallback from '../CanUseIdleCallback/CanUseIdleCallback.js'
import * as ConnectDevtools from '../ConnectDevtools/ConnectDevtools.js'
import * as ConnectElectron from '../ConnectElectron/ConnectElectron.js'
import * as GetPageObjectPath from '../GetPageObjectPath/GetPageObjectPath.js'
import * as KillExistingIdeInstances from '../KillExistingIdeInstances/KillExistingIdeInstances.js'
import * as MemoryLeakWorker from '../MemoryLeakWorker/MemoryLeakWorker.js'
import * as PageObject from '../PageObject/PageObject.js'
import { prepareBoth } from '../PrepareBoth/PrepareBoth.js'
import * as VideoRecording from '../VideoRecording/VideoRecording.js'

export const prepareTests = async (rpc, cwd, headlessMode, recordVideo, connectionId, timeouts, ide, ideVersion, vscodePath, commit) => {
  const pageObjectPath = GetPageObjectPath.getPageObjectPath()
  const isFirstConnection = true
  const canUseIdleCallback = CanUseIdleCallback.canUseIdleCallback(headlessMode)
  await KillExistingIdeInstances.killExisingIdeInstances(ide)
  const { webSocketUrl, devtoolsWebSocketUrl, electronObjectId, monkeyPatchedElectronId, initializationWorkerRpc } = await prepareBoth(
    headlessMode,
    cwd,
    ide,
    vscodePath,
    commit,
    connectionId,
    isFirstConnection,
    canUseIdleCallback,
  )

  // TODO connect workers in parallel
  const {} = await ConnectElectron.connectElectron(rpc, connectionId, headlessMode, webSocketUrl, isFirstConnection, canUseIdleCallback)
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
  )

  await initializationWorkerRpc.invoke('Initialize.undoMonkeyPatch')
  await PageObject.create(rpc, connectionId, isFirstConnection, headlessMode, timeouts, ideVersion, pageObjectPath)

  return {
    rpc,
    webSocketUrl,
    devtoolsWebSocketUrl,
    electronObjectId,
    monkeyPatchedElectronId,
  }
}
