import * as CanUseIdleCallback from '../CanUseIdleCallback/CanUseIdleCallback.js'
import { connectWorkers } from '../ConnectWorkers/ConnectWorkers.js'
import * as GetPageObjectPath from '../GetPageObjectPath/GetPageObjectPath.js'
import * as KillExistingIdeInstances from '../KillExistingIdeInstances/KillExistingIdeInstances.js'
import * as PageObject from '../PageObject/PageObject.js'
import { prepareBoth } from '../PrepareBoth/PrepareBoth.js'

export const prepareTests = async (rpc, cwd, headlessMode, recordVideo, connectionId, timeouts, ide, ideVersion, vscodePath, commit) => {
  const pageObjectPath = GetPageObjectPath.getPageObjectPath()
  const isFirstConnection = true
  const canUseIdleCallback = CanUseIdleCallback.canUseIdleCallback(headlessMode)
  await KillExistingIdeInstances.killExisingIdeInstances(ide)
  const { webSocketUrl, devtoolsWebSocketUrl, electronObjectId, monkeyPatchedElectronId, initializationWorkerRpc, parsedVersion } = await prepareBoth(
    headlessMode,
    cwd,
    ide,
    vscodePath,
    commit,
    connectionId,
    isFirstConnection,
    canUseIdleCallback,
  )
  await connectWorkers(
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
  )
  await initializationWorkerRpc.invoke('Initialize.undoMonkeyPatch')
  await PageObject.create(rpc, connectionId, isFirstConnection, headlessMode, timeouts, parsedVersion, pageObjectPath)

  return {
    rpc,
    webSocketUrl,
    devtoolsWebSocketUrl,
    electronObjectId,
    monkeyPatchedElectronId,
    parsedVersion,
  }
}
