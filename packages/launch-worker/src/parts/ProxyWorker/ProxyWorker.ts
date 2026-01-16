import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { getProxyWorkerUrl } from '../GetProxyWorkerUrl/GetProxyWorkerUrl.ts'

export const launch = async () => {
  const url = getProxyWorkerUrl()
  const rpc = await NodeWorkerRpcParent.create({
    commandMap: {},
    execArgv: [],
    path: url,
    stdio: 'inherit',
  })
  return rpc
}
