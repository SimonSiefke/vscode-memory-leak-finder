import * as GetStorageWorkerUrl from '../GetStorageWorkerUrl/GetStorageWorkerUrl.js'
import * as IpcParent from '../IpcParent/IpcParent.js'
import * as IpcParentType from '../IpcParentType/IpcParentType.js'

export const launch = async () => {
  const url = GetStorageWorkerUrl.getStorageWorkerUrl()
  const rpc = await IpcParent.create({
    method: IpcParentType.NodeWorkerThread,
    path: url,
    stdio: 'inherit',
    execArgv: [],
  })
  return rpc
}
