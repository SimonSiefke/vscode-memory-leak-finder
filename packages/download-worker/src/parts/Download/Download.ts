import { launchNetworkWorker } from '../LaunchNetworkWorker/LaunchNetworkWorker.ts'

export const download = async (name: string, downloadUrls: string[], outFile: string): Promise<void> => {
  if (downloadUrls.length === 0) {
    throw new Error(`No download URLs configured for ${name}`)
  }
  await using rpc = await launchNetworkWorker()
  for (const [index, downloadUrl] of downloadUrls.entries()) {
    try {
      await rpc.invoke('Network.download', name, downloadUrl, outFile)
      return
    } catch (error) {
      if (index === downloadUrls.length - 1) {
        throw error
      }
    }
  }
}
