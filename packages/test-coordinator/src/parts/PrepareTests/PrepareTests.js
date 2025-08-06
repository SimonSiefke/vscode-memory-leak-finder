import * as CanUseIdleCallback from '../CanUseIdleCallback/CanUseIdleCallback.js'
import * as ConnectDevtools from '../ConnectDevtools/ConnectDevtools.js'
import * as ConnectElectron from '../ConnectElectron/ConnectElectron.js'
import * as KillExistingIdeInstances from '../KillExistingIdeInstances/KillExistingIdeInstances.js'
import * as LaunchIde from '../LaunchIde/LaunchIde.js'
import * as MemoryLeakWorker from '../MemoryLeakWorker/MemoryLeakWorker.js'
import * as PageObject from '../PageObject/PageObject.js'
import * as VideoRecording from '../VideoRecording/VideoRecording.js'
import * as WaitForDevtoolsListening from '../WaitForDevtoolsListening/WaitForDevtoolsListening.js'

export const prepareTests = async (rpc, cwd, headlessMode, recordVideo, connectionId, timeouts, ide, ideVersion, vscodePath, commit) => {
  // TODO move whole ide launch into separate worker
  const isFirstConnection = true
  const canUseIdleCallback = CanUseIdleCallback.canUseIdleCallback(headlessMode)
  await KillExistingIdeInstances.killExisingIdeInstances(ide)
  const { child, webSocketUrl } = await LaunchIde.launchIde({
    headlessMode,
    cwd,
    ide,
    vscodePath,
    commit,
  })
  const devtoolsWebSocketUrlPromise = WaitForDevtoolsListening.waitForDevtoolsListening(child.stderr)
  const { monkeyPatchedElectron, electronObjectId, callFrameId } = await ConnectElectron.connectElectron(
    rpc,
    connectionId,
    headlessMode,
    webSocketUrl,
    isFirstConnection,
    canUseIdleCallback,
  )
  const devtoolsWebSocketUrl = await devtoolsWebSocketUrlPromise
  if (recordVideo) {
    await VideoRecording.start(devtoolsWebSocketUrl)
  }
  await MemoryLeakWorker.startWorker(devtoolsWebSocketUrl)
  await ConnectDevtools.connectDevtools(
    rpc,
    connectionId,
    devtoolsWebSocketUrl,
    monkeyPatchedElectron,
    electronObjectId,
    callFrameId,
    isFirstConnection,
  )
  await PageObject.create(rpc, connectionId, isFirstConnection, headlessMode, timeouts, ideVersion)
  return {
    rpc,
    webSocketUrl,
    devtoolsWebSocketUrl,
    electronObjectId,
    callFrameId,
    monkeyPatchedElectron,
  }
}
