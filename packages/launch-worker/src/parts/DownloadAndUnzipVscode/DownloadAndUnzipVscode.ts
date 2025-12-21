import * as DownloadWorker from '../DownloadWorker/DownloadWorker.ts'

/**
 * @param {string | { vscodeVersion?: string; insidersCommit?: string }} options
 */
export const downloadAndUnzipVscode = async (options) => {
  const rpc = await DownloadWorker.launch()
  const path = await rpc.invoke('Download.downloadAndUnzipVscode', options)
  await rpc.dispose()
  return path
}
