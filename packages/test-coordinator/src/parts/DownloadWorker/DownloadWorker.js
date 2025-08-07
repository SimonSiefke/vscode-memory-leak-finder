import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import * as CommandMapRef from '../CommandMapRef/CommandMapRef.js'
import * as GetDownloadWorkerUrl from '../GetDownloadWorkerUrl/GetDownloadWorkerUrl.js'

// TODO dispose worker on next test run
export const launch = async () => {
  const url = GetDownloadWorkerUrl.getDownloadWorkerUrl()
  const rpc = await NodeWorkerRpcParent.create({
    path: url,
    stdio: 'inherit',
    execArgv: [],
    commandMap: CommandMapRef.commandMapRef,
  })
  return rpc
}
