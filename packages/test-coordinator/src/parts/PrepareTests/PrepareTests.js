import * as CanUseIdleCallback from '../CanUseIdleCallback/CanUseIdleCallback.js'
import { connectWorkers } from '../ConnectWorkers/ConnectWorkers.js'
import * as KillExistingIdeInstances from '../KillExistingIdeInstances/KillExistingIdeInstances.js'
import * as PageObject from '../PageObject/PageObject.js'
import { prepareBoth } from '../PrepareBoth/PrepareBoth.js'

export const prepareTests = async (rpc, cwd, headlessMode, recordVideo, connectionId, timeouts, ide, ideVersion, vscodePath, commit) => {
  // TODO move whole ide launch into separate worker
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
  await connectWorkers(rpc, connectionId, headlessMode, webSocketUrl, isFirstConnection, canUseIdleCallback)
  await initializationWorkerRpc.invoke('Initialize.undoMonkeyPatch')
  await PageObject.create(rpc, connectionId, isFirstConnection, headlessMode, timeouts, ideVersion)
  return {
    rpc,
    webSocketUrl,
    devtoolsWebSocketUrl,
    electronObjectId,
    monkeyPatchedElectronId,
  }
}
