import * as Callback from '../Callback/Callback.js'
import * as Command from '../Command/Command.js'
import * as GetRepositoryWorkerUrl from '../GetRepositoryWorkerUrl/GetRepositoryWorkerUrl.js'
import * as HandleIpc from '../HandleIpc/HandleIpc.js'
import * as IpcParent from '../IpcParent/IpcParent.js'
import * as IpcParentType from '../IpcParentType/IpcParentType.js'

export const launch = async () => {
  const url = GetRepositoryWorkerUrl.getRepositoryWorkerUrl()
  const ipc = await IpcParent.create({
    method: IpcParentType.NodeWorkerThread,
    url,
    stdio: 'inherit',
    execArgv: [],
  })
  HandleIpc.handleIpc(ipc, Command.execute, Callback.resolve)
  return ipc
} 