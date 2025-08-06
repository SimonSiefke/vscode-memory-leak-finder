import * as GetDownloadWorkerUrl from '../GetDownloadWorkerUrl/GetDownloadWorkerUrl.js'
import * as IpcParent from '../IpcParent/IpcParent.js'
import * as IpcParentType from '../IpcParentType/IpcParentType.js'

// TODO dispose worker on next test run
export const launch = async () => {
  const url = GetDownloadWorkerUrl.getDownloadWorkerUrl()
  const rpc = await IpcParent.create({
    method: IpcParentType.NodeWorkerThread,
    url,
    stdio: 'inherit',
    execArgv: [],
  })
  return rpc
}
