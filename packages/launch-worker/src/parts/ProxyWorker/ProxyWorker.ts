import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { getProxyWorkerUrl } from '../GetProxyWorkerUrl/GetProxyWorkerUrl.ts'

export const launch = async () => {
  const url = getProxyWorkerUrl()
  const rpc = await NodeWorkerRpcParent.create({
    path: url,
    stdio: 'inherit',
    execArgv: [],
    commandMap: {},
  })
  return rpc
}
