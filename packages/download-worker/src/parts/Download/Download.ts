import { launchNetworkWorker } from '../LaunchNetworkWorker/LaunchNetworkWorker.ts'

export const download = async (name: string, downloadUrls: string[], outFile: string): Promise<void> => {
  await using rpc = await launchNetworkWorker()
  const downloadUrl = downloadUrls[0]
  await rpc.invoke('Network.download', name, downloadUrl, outFile)
}
