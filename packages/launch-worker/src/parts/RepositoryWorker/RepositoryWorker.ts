import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { getRepositoryWorkerUrl } from '../GetRepositoryWorkerUrl/GetRepositoryWorkerUrl.ts'

export const launch = async () => {
  const url = getRepositoryWorkerUrl()
  const rpc = await NodeWorkerRpcParent.create({
    commandMap: {},
    execArgv: [],
    path: url,
    stdio: 'inherit',
  })
  return rpc
}
