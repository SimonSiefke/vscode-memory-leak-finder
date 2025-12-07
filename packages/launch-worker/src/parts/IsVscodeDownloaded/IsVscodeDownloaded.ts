import * as DownloadWorker from '../DownloadWorker/DownloadWorker.ts'

export const isVscodeDownloaded = async (vscodeVersion: string, vscodePath: string, commit: string): Promise<boolean> => {
  const rpc = await DownloadWorker.launch()
  const result = await rpc.invoke('Download.isVscodeDownloaded', vscodeVersion, vscodePath, commit)
  await rpc.dispose()
  return result
}

