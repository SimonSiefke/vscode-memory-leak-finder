import VError from 'verror'
import * as Assert from '../Assert/Assert.js'
import * as ConnectionState from '../ConnectionState/ConnectionState.js'
import * as LaunchElectronApp from '../LaunchElectronApp/LaunchElectronApp.js'

export const connectElectronApp = async (connectionId, headlessMode) => {
  Assert.number(connectionId)
  const electronIpc = ConnectionState.get(connectionId)
  if (!electronIpc) {
    throw new VError(`no websocket connection found`)
  }
  const electronApp = await LaunchElectronApp.launch({
    headlessMode,
    electronIpc,
  })
  console.log({ electronApp })
}
