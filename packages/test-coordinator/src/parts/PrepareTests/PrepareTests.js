import * as ConnectDevtools from '../ConnectDevtools/ConnectDevtools.js'
import * as ConnectElectron from '../ConnectElectron/ConnectElectron.js'
import * as KillExistingVscodeInstances from '../KillExistingVscodeInstances/KillExistingVscodeInstances.js'
import * as LaunchVsCode from '../LaunchVsCode/LaunchVsCode.js'
import * as PageObject from '../PageObject/PageObject.js'
import * as TestWorker from '../TestWorker/TestWorker.js'
import * as WaitForDevtoolsListening from '../WaitForDevtoolsListening/WaitForDevtoolsListening.js'

export const prepareTests = async (cwd, headlessMode, connectionId) => {
  await KillExistingVscodeInstances.killExistingVsCodeInstances()
  const { child, webSocketUrl } = await LaunchVsCode.launchVsCode({
    headlessMode,
    cwd,
  })
  const ipc = await TestWorker.launch()
  const devtoolsWebSocketUrlPromise = WaitForDevtoolsListening.waitForDevtoolsListening(child.stderr)
  const { monkeyPatchedElectron, electronObjectId, callFrameId } = await ConnectElectron.connectElectron(
    ipc,
    connectionId,
    headlessMode,
    webSocketUrl,
  )
  const devtoolsWebSocketUrl = await devtoolsWebSocketUrlPromise
  await ConnectDevtools.connectDevtools(ipc, connectionId, devtoolsWebSocketUrl, monkeyPatchedElectron, electronObjectId, callFrameId)
  await PageObject.create(ipc, connectionId)
  return ipc
}
