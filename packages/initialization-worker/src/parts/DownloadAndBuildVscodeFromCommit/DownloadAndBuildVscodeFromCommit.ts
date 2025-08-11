import * as RepositoryWorker from '../RepositoryWorker/RepositoryWorker.ts'

/**
 * @param {string} commitHash
 */
export const downloadAndBuildVscodeFromCommit = async (commitHash) => {
  const rpc = await RepositoryWorker.launch()
  const path = await rpc.invoke('Download.downloadAndBuildVscodeFromCommit', commitHash)
  await rpc.dispose()
  return path
}
