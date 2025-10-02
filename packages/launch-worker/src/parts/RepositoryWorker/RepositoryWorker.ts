import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { getRepositoryWorkerUrl } from '../GetRepositoryWorkerUrl/GetRepositoryWorkerUrl.ts'

export const launch = async () => {
  const url = getRepositoryWorkerUrl()
  const rpc = await NodeWorkerRpcParent.create({
    path: url,
    stdio: 'inherit',
    execArgv: [],
    commandMap: {},
  })
  return rpc
}
