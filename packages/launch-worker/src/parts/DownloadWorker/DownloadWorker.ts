import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import * as CommandMapRef from '../CommandMapRef/CommandMapRef.ts'
import * as GetDownloadWorkerUrl from '../GetDownloadWorkerUrl/GetDownloadWorkerUrl.ts'

// TODO dispose worker on next test run
export const launch = async () => {
  const url = GetDownloadWorkerUrl.getDownloadWorkerUrl()
  const rpc = await NodeWorkerRpcParent.create({
    commandMap: CommandMapRef.commandMapRef,
    execArgv: [],
    path: url,
    stdio: 'inherit',
  })
  return rpc
}
