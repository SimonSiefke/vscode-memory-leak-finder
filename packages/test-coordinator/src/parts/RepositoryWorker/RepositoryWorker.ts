import { NodeWorkerRpcParent, type Rpc } from '@lvce-editor/rpc'
import * as GetRepositoryWorkerUrl from '../GetRepositoryWorkerUrl/GetRepositoryWorkerUrl.ts'

export const launch = async (): Promise<Rpc> => {
  const url = GetRepositoryWorkerUrl.getRepositoryWorkerUrl()
  const rpc = await NodeWorkerRpcParent.create({
    path: url,
    stdio: 'inherit',
    execArgv: [],
    commandMap: {},
  })
  return rpc
}
