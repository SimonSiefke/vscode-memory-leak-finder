import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import * as Disposables from '../Disposables/Disposables.ts'
import { getInitializationWorkerUrl } from '../GetInitializationWorkerUrl/GetInitializationWorkerUrl.ts'

export const launchInitializationWorker = async () => {
  const url = getInitializationWorkerUrl()
  console.log(`[TEST-COORDINATOR] launching initialization worker`)
  const rpc = await NodeWorkerRpcParent.create({
    path: url,
    stdio: 'inherit',
    commandMap: {},
  })
  Disposables.add(async () => {
    console.log(`[TEST-COORDINATOR] disposing initialization worker`)
    await rpc.invoke('Initialize.exit')
    console.log(`[TEST-COORDINATOR] initialization worker disposed`)
  })
  return rpc
}
