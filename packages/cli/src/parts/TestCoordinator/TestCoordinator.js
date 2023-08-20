import * as GetTestCoordinatorUrl from '../GetTestCoordinatorUrl/GetTestCoordinatorUrl.js'
import * as IpcParent from '../IpcParent/IpcParent.js'

export const listen = async (method) => {
  const url = GetTestCoordinatorUrl.getTestCoordinatorUrl()
  return IpcParent.create({
    method,
    url,
  })
}
