import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { getInitializationWorkerUrl } from '../GetInitializationWorkerUrl/GetInitializationWorkerUrl.ts'

export const launchInitializationWorker = async () => {
  const url = getInitializationWorkerUrl()
  const rpc = await NodeWorkerRpcParent.create({
    path: url,
    stdio: 'inherit',
    commandMap: {},
  })

  const originalDispose = rpc.dispose.bind(rpc)
  const dispose = async () => {
    await rpc.invoke('Initialize.exit')
    await originalDispose()
  }
  // @ts-ignore
  rpc.dispose = dispose
  return rpc
}
