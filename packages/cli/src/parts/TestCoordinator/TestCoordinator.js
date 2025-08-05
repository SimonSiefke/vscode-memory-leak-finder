import * as GetTestCoordinatorUrl from '../GetTestCoordinatorUrl/GetTestCoordinatorUrl.js'
import * as IpcParent from '../IpcParent/IpcParent.js'

export const listen = async (method) => {
  const url = GetTestCoordinatorUrl.getTestCoordinatorUrl()
  const rpc = await IpcParent.create({
    method,
    path: url,
    name: 'Test Coordinator',
    ref: false,
    argv: ['--ipc-type=worker-thread'],
  })
  return rpc
}
