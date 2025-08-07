import * as DownloadWorker from '../DownloadWorker/DownloadWorker.js'

/**
 * @param {string} commitHash
 */
export const downloadAndBuildVscodeFromCommit = async (commitHash) => {
  const rpc = await DownloadWorker.launch()
  const path = await rpc.invoke('Download.downloadAndBuildVscodeFromCommit', commitHash)
  await rpc.dispose()
  return path
}
