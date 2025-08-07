import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { getInitializationWorkerUrl } from '../GetInitializationWorkerUrl/GetInitializationWorkerUrl.js'

export const launchInitializationWorker = async () => {
  const url = getInitializationWorkerUrl()
  const rpc = await NodeWorkerRpcParent.create({
    path: url,
    stdio: 'inherit',
    commandMap: {},
  })
  return rpc
}
