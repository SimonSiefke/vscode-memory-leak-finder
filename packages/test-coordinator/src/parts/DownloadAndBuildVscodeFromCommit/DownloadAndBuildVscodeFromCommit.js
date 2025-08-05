import * as DownloadWorker from '../DownloadWorker/DownloadWorker.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'

/**
 * @param {string} commitHash
 */
export const downloadAndBuildVscodeFromCommit = async (commitHash) => {
  const ipc = await DownloadWorker.launch()
  const path = await JsonRpc.invoke(ipc, 'Download.downloadAndBuildVscodeFromCommit', commitHash)
  ipc.dispose()
  return path
}
