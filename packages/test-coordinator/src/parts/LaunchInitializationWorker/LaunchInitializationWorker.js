import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { getInitializationWorkerUrl } from '../GetInitializationWorkerUrl/GetInitializationWorkerUrl.js'
import * as Disposables from '../Disposables/Disposables.js'

export const launchInitializationWorker = async () => {
  const url = getInitializationWorkerUrl()
  const rpc = await NodeWorkerRpcParent.create({
    path: url,
    stdio: 'inherit',
    commandMap: {},
  })
  Disposables.add(async () => {
    await rpc.invoke('Initialize.exit')
  })
  return rpc
}
