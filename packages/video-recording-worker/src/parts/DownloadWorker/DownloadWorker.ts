import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import * as GetDownloadWorkerUrl from '../GetDownloadWorkerUrl/GetDownloadWorkerUrl.ts'

export const launch = async () => {
  const url = GetDownloadWorkerUrl.getDownloadWorkerUrl()
  const rpc = await NodeWorkerRpcParent.create({
    commandMap: {},
    execArgv: [],
    path: url,
    stdio: 'inherit',
  })
  return rpc
}
