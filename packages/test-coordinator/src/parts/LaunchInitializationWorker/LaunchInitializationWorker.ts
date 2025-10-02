import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { getLaunchWorkerUrl } from '../GetLaunchWorkerUrl/GetLaunchWorkerUrl.ts'

export const launchInitializationWorker = async () => {
  const url = getLaunchWorkerUrl()
  const rpc = await NodeWorkerRpcParent.create({
    path: url,
    stdio: 'inherit',
    commandMap: {},
  })

  const originalDispose = rpc.dispose.bind(rpc)
  const dispose = async () => {
    await rpc.invoke('Launch.exit')
    await originalDispose()
  }
  // @ts-ignore
  rpc.dispose = dispose
  return rpc
}
