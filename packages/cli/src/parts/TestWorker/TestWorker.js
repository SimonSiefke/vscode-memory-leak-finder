import * as GetTestWorkerUrl from '../GetTestWorkerUrl/GetTestWorkerUrl.js'
import * as IpcParent from '../IpcParent/IpcParent.js'

export const listen = async (method) => {
  const url = GetTestWorkerUrl.getTestWorkerUrl()
  return IpcParent.create({
    method,
    url,
  })
}
