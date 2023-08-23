import * as IpcParent from '../IpcParent/IpcParent.js'
import * as IpcParentType from '../IpcParentType/IpcParentType.js'
import * as GetTestWorkerUrl from '../GetTestWorkerUrl/GetTestWorkerUrl.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'

// TODO dispose worker on next test run
export const launch = async () => {
  const url = GetTestWorkerUrl.getTestWorkerUrl()
  const ipc = await IpcParent.create({
    method: IpcParentType.NodeWorkerThread,
    url,
    stdio: 'inherit',
  })
  return {
    ipc,
    invoke(method, ...params) {
      return JsonRpc.invoke(this.ipc, method, ...params)
    },
  }
}
