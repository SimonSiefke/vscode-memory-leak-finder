import * as ConnectDevtools from '../ConnectDevtools/ConnectDevtools.js'
import * as ConnectElectron from '../ConnectElectron/ConnectElectron.js'
import * as Id from '../Id/Id.js'
import * as LaunchVsCode from '../LaunchVsCode/LaunchVsCode.js'
import * as PageObject from '../PageObject/PageObject.js'
import * as TestWorker from '../TestWorker/TestWorker.js'
import * as WaitForDevtoolsListening from '../WaitForDevtoolsListening/WaitForDevtoolsListening.js'

export const prepareTests = async (cwd, headlessMode) => {
  const { child, webSocketUrl } = await LaunchVsCode.launchVsCode({
    headlessMode,
    cwd,
  })
  const ipc = await TestWorker.launch()
  const connectionId = Id.create()
  const devtoolsWebSocketUrlPromise = WaitForDevtoolsListening.waitForDevtoolsListening(child.stderr)
  await ConnectElectron.connectElectron(ipc, connectionId, headlessMode, webSocketUrl)
  const devtoolsWebSocketUrl = await devtoolsWebSocketUrlPromise
  console.log({ devtoolsWebSocketUrl })
  await ConnectDevtools.connectDevtools(ipc, connectionId, devtoolsWebSocketUrl)
  await PageObject.create(ipc, connectionId)
  return ipc
}
