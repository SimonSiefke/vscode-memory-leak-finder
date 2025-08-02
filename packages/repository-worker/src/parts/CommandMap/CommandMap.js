import { join } from 'node:path'
import { downloadAndBuildVscodeFromCommit } from '../DownloadAndBuildVscodeFromCommit/DownloadAndBuildVscodeFromCommit.js'
import * as Root from '../Root/Root.js'

const VSCODE_NODE_MODULES_CACHE_DIR = '.vscode-node-modules'

const getCacheDir = () => {
  return join(Root.root, VSCODE_NODE_MODULES_CACHE_DIR)
}

export const commandMap = {
  'Repository.downloadAndBuildVscodeFromCommit': (commitRef, repoUrl, reposDir) => {
    const cacheDir = getCacheDir()
    return downloadAndBuildVscodeFromCommit(commitRef, repoUrl, reposDir, cacheDir)
  },
}
