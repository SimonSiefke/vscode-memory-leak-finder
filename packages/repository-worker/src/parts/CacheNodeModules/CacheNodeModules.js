import { join } from 'node:path'
import { glob } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { VError } from '@lvce-editor/verror'
import * as GetCacheFileOperations from '../GetCacheFileOperations/GetCacheFileOperations.js'
import * as ApplyFileOperations from '../ApplyFileOperations/ApplyFileOperations.js'
import * as Root from '../Root/Root.js'

const VSCODE_NODE_MODULES_CACHE_DIR = '.vscode-node-modules'

/**
 * @param {string} repoPath
 * @param {string} commitHash
 */
export const addNodeModulesToCache = async (repoPath, commitHash) => {
  try {
    const cacheDir = join(Root.root, VSCODE_NODE_MODULES_CACHE_DIR)
    const cachedNodeModulesPath = join(cacheDir, commitHash)

    // Convert paths to file URIs
    const repoPathUri = pathToFileURL(repoPath).href
    const cacheDirUri = pathToFileURL(cacheDir).href
    const cachedNodeModulesPathUri = pathToFileURL(cachedNodeModulesPath).href

    // Find all node_modules directories in the repository using glob
    const allNodeModulesPaths = await Array.fromAsync(glob('**/node_modules', { cwd: repoPath }))
    const nodeModulesPaths = allNodeModulesPaths.filter((path) => !path.includes('node_modules/node_modules') && !path.includes('.git'))

    const fileOperations = await GetCacheFileOperations.getCacheFileOperations(
      repoPathUri,
      commitHash,
      cacheDirUri,
      cachedNodeModulesPathUri,
      nodeModulesPaths,
    )
    await ApplyFileOperations.applyFileOperations(fileOperations)
  } catch (error) {
    throw new VError(error, `Failed to cache node_modules`)
  }
}
