import { launchNetworkWorker } from '../LaunchNetworkWorker/LaunchNetworkWorker.ts'

export const getJson = async <T>(url: string): Promise<T> => {
  await using rpc = await launchNetworkWorker()
  const result = await rpc.invoke('Network.getJson', url)
  return result
}
