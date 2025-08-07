import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import * as GetStdoutWorkerUrl from '../GetStdoutWorkerUrl/GetStdoutWorkerUrl.ts'

export const launchStdoutWorker = async () => {
  const url = GetStdoutWorkerUrl.getStdoutWorkerUrl()
  const rpc = await NodeWorkerRpcParent.create({
    path: url,
    // @ts-ignore
    name: 'Stdout Worker',
    // ref: false,
    stdio: 'inherit',
    commandMap: {},
  })
  return rpc
}
