import * as GetTestCoordinatorUrl from '../GetTestCoordinatorUrl/GetTestCoordinatorUrl.js'
import * as IpcParent from '../IpcParent/IpcParent.js'

export const listen = async (method) => {
  const url = GetTestCoordinatorUrl.getTestCoordinatorUrl()
  const ipc = await IpcParent.create({
    method,
    url,
    name: 'Test Coordinator',
    ref: false,
    stdio: 'inherit',
  })
  return ipc
}
