import * as DownloadWorker from '../DownloadWorker/DownloadWorker.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'

/**
 * @param {string} vscodeVersion
 */
export const downloadAndUnzipVscode = async (vscodeVersion) => {
  const ipc = await DownloadWorker.launch()
  const path = await JsonRpc.invoke(ipc, 'Download.downloadAndUnzipVscode', vscodeVersion)
  ipc.dispose()
  return path
}
