import * as DownloadWorker from '../DownloadWorker/DownloadWorker.ts'

/**
 * @param {string} vscodeVersion
 */
export const downloadAndUnzipVscode = async (vscodeVersion) => {
  const rpc = await DownloadWorker.launch()
  const path = await rpc.invoke('Download.downloadAndUnzipVscode', vscodeVersion)
  await rpc.dispose()
  return path
}
