import * as ConnectDevtools from '../ConnectDevtools/ConnectDevtools.js'
import * as ConnectElectron from '../ConnectElectron/ConnectElectron.js'
import * as KillExistingVscodeInstances from '../KillExistingVscodeInstances/KillExistingVscodeInstances.js'
import * as LaunchVsCode from '../LaunchVsCode/LaunchVsCode.js'
import * as PageObject from '../PageObject/PageObject.js'
import * as WaitForDevtoolsListening from '../WaitForDevtoolsListening/WaitForDevtoolsListening.js'

export const prepareTests = async (ipc, cwd, headlessMode, connectionId) => {
  await KillExistingVscodeInstances.killExistingVsCodeInstances()
  const { child, webSocketUrl } = await LaunchVsCode.launchVsCode({
    headlessMode,
    cwd,
  })
  const devtoolsWebSocketUrlPromise = WaitForDevtoolsListening.waitForDevtoolsListening(child.stderr)
  await ConnectElectron.connectElectron(ipc, connectionId, headlessMode, webSocketUrl)
  const devtoolsWebSocketUrl = await devtoolsWebSocketUrlPromise
  await ConnectDevtools.connectDevtools(ipc, connectionId, devtoolsWebSocketUrl)
  await PageObject.create(ipc, connectionId)
  return {
    ipc,
    webSocketUrl,
    devtoolsWebSocketUrl,
  }
}
