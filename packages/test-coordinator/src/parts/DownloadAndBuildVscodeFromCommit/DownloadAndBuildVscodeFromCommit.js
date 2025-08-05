import * as RepositoryWorker from '../RepositoryWorker/RepositoryWorker.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'

/**
 * @param {string} commitHash
 */
export const downloadAndBuildVscodeFromCommit = async (commitHash) => {
  const ipc = await RepositoryWorker.launch()
  const path = await JsonRpc.invoke(ipc, 'Repository.downloadAndBuildVscodeFromCommit', commitHash)
  ipc.dispose()
  return path
}
