import * as DownloadWorker from '../DownloadWorker/DownloadWorker.ts'

export const downloadAndUnzipVscode = async (options: string | { vscodeVersion?: string; insidersCommit?: string; updateUrl?: string }) => {
  const rpc = await DownloadWorker.launch()
  const path = await rpc.invoke('Download.downloadAndUnzipVscode', options)
  await rpc.dispose()
  return path
}
