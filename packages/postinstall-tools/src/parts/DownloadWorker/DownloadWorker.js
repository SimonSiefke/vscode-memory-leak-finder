import * as Callback from '../Callback/Callback.js'
import * as Command from '../Command/Command.js'
import * as GetDownloadWorkerUrl from '../GetDownloadWorkerUrl/GetDownloadWorkerUrl.js'
import * as HandleIpc from '../HandleIpc/HandleIpc.js'
import * as IpcParent from '../IpcParent/IpcParent.js'
import * as IpcParentType from '../IpcParentType/IpcParentType.js'

// TODO dispose worker on next test run
export const launch = async (runMode) => {
  const url = GetDownloadWorkerUrl.getDownloadWorkerUrl()
  const ipc = await IpcParent.create({
    method: IpcParentType.NodeWorkerThread,
    url,
    stdio: 'inherit',
    execArgv: [],
  })
  HandleIpc.handleIpc(ipc, Command.execute, Callback.resolve)
  return ipc
}
