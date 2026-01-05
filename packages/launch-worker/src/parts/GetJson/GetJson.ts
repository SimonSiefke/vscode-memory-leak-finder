import { launchNetworkWorker } from '../LaunchNetworkWorker/LaunchNetworkWorker.ts'

export const getJson = async (url: string): Promise<any> => {
  await using rpc = await launchNetworkWorker()
  const result = await rpc.invoke('Network.getJson', url)
  return result
}
