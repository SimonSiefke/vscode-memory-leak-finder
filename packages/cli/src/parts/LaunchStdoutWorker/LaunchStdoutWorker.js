import * as GetStdoutWorkerUrl from '../GetStdoutWorkerUrl/GetStdoutWorkerUrl.js'
import * as IpcParent from '../IpcParent/IpcParent.js'
import * as IpcParentType from '../IpcParentType/IpcParentType.js'

export const launchStdoutWorker = async () => {
  const url = GetStdoutWorkerUrl.getStdoutWorkerUrl()
  const rpc = await IpcParent.create({
    method: IpcParentType.NodeWorkerThread,
    path: url,
    name: 'Stdout Worker',
    ref: false,
    stdio: 'inherit',
    commandMap: {},
    argv: ['--ipc-type=worker-thread'],
  })
  return rpc
}
