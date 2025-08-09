import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import * as CommandMapRef from '../CommandMapRef/CommandMapRef.ts'
import * as GetStorageWorkerUrl from '../GetStorageWorkerUrl/GetStorageWorkerUrl.ts'

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
