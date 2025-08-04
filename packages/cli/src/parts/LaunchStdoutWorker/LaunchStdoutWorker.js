import * as GetStdoutWorkerUrl from '../GetStdoutWorkerUrl/GetStdoutWorkerUrl.js'
import * as HandleIpc from '../HandleIpc/HandleIpc.js'
import * as IpcParent from '../IpcParent/IpcParent.js'
import * as IpcParentType from '../IpcParentType/IpcParentType.js'

export const launchStdoutWorker = async () => {
  const url = GetStdoutWorkerUrl.getStdoutWorkerUrl()
  const worker = await IpcParent.create({
    method: IpcParentType.NodeWorkerThread,
    url,
    name: 'Stdout Worker',
    ref: false,
  })
  HandleIpc.handleIpc(worker)
  return worker
}
