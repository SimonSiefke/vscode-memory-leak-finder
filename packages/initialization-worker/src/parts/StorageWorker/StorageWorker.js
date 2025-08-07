import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import * as CommandMapRef from '../CommandMapRef/CommandMapRef.js'
import * as GetStorageWorkerUrl from '../GetStorageWorkerUrl/GetStorageWorkerUrl.js'

export const launch = async () => {
  const url = GetStorageWorkerUrl.getStorageWorkerUrl()
  const rpc = await NodeWorkerRpcParent.create({
    path: url,
    stdio: 'inherit',
    execArgv: [],
    commandMap: CommandMapRef.commandMapRef,
  })
  return rpc
}
