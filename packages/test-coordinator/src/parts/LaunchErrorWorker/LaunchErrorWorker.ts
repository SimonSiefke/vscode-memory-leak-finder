import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import * as ErrorWorkerUrl from '../ErrorWorkerUrl/ErrorWorkerUrl.ts'

export const launchErrorWorker = async () => {
  const rpc = await NodeWorkerRpcParent.create({
    commandMap: {},
    path: ErrorWorkerUrl.errorWorkerUrl,
    stdio: 'inherit',
  })
  return rpc
}
