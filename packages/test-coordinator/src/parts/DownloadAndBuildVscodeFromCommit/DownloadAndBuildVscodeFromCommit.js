import * as RepositoryWorker from '../RepositoryWorker/RepositoryWorker.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'
import * as Path from '../Path/Path.js'
import * as Root from '../Root/Root.js'

const DEFAULT_REPO_URL = 'https://github.com/microsoft/vscode.git'
const DEFAULT_REPOS_DIR = Path.join(Root.root, '.vscode-repos')
const DEFAULT_CACHE_DIR = Path.join(Root.root, '.vscode-node-modules')
const DEFAULT_USE_NICE = false

/**
 * @param {string} commitHash
 */
export const downloadAndBuildVscodeFromCommit = async (commitHash) => {
  const ipc = await RepositoryWorker.launch()
  try {
    const path = await JsonRpc.invoke(ipc, 'Repository.downloadAndBuildVscodeFromCommit', 
      commitHash, 
      DEFAULT_REPO_URL, 
      DEFAULT_REPOS_DIR, 
      DEFAULT_CACHE_DIR, 
      DEFAULT_USE_NICE
    )
    return path
  } finally {
    ipc.dispose()
  }
}
