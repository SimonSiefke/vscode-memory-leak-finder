import * as ConnectDevtools from '../ConnectDevtools/ConnectDevtools.js'
import * as ConnectElectron from '../ConnectElectron/ConnectElectron.js'
import * as KillExistingVscodeInstances from '../KillExistingVscodeInstances/KillExistingVscodeInstances.js'
import * as LaunchVsCode from '../LaunchVsCode/LaunchVsCode.js'
import * as PageObject from '../PageObject/PageObject.js'
import * as WaitForDevtoolsListening from '../WaitForDevtoolsListening/WaitForDevtoolsListening.js'
import * as VideoRecording from '../VideoRecording/VideoRecording.js'

export const prepareTests = async (ipc, cwd, headlessMode, connectionId) => {
  const isFirstConnection = true
  await KillExistingVscodeInstances.killExistingVsCodeInstances()
  const { child, webSocketUrl } = await LaunchVsCode.launchVsCode({
    headlessMode,
    cwd,
  })
  const devtoolsWebSocketUrlPromise = WaitForDevtoolsListening.waitForDevtoolsListening(child.stderr)
  const { monkeyPatchedElectron, electronObjectId, callFrameId } = await ConnectElectron.connectElectron(
    ipc,
    connectionId,
    headlessMode,
    webSocketUrl,
    isFirstConnection,
  )
  const devtoolsWebSocketUrl = await devtoolsWebSocketUrlPromise
  // await VideoRecording.start(devtoolsWebSocketUrl)
  await ConnectDevtools.connectDevtools(
    ipc,
    connectionId,
    devtoolsWebSocketUrl,
    monkeyPatchedElectron,
    electronObjectId,
    callFrameId,
    isFirstConnection,
  )
  await PageObject.create(ipc, connectionId, isFirstConnection)
  return {
    ipc,
    webSocketUrl,
    devtoolsWebSocketUrl,
    electronObjectId,
    callFrameId,
    monkeyPatchedElectron,
  }
}
