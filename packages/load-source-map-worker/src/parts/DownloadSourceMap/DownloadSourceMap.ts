import { VError } from '@lvce-editor/verror'
import { basename } from 'node:path'
import { launchNetworkWorker } from '../LaunchNetworkWorker/LaunchNetworkWorker.ts'

export const downloadSourceMap = async (url: string, outFilePath: string): Promise<void> => {
  try {
    await using rpc = await launchNetworkWorker()
    const name = basename(outFilePath)
    await rpc.invoke('Network.download', name, url, outFilePath)
  } catch (error) {
    throw new VError(error, `Failed to download source map from ${url}`)
  }
}
