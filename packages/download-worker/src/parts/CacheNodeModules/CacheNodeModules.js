import { join } from 'node:path'
import { glob } from 'node:fs/promises'
import * as GetCacheFileOperations from '../GetCacheFileOperations/GetCacheFileOperations.js'
import * as ApplyFileOperations from '../ApplyFileOperations/ApplyFileOperations.js'
import * as ComputeVscodeNodeModulesCacheKey from '../ComputeVscodeNodeModulesCacheKey/ComputeVscodeNodeModulesCacheKey.js'
import * as Root from '../Root/Root.js'

const VSCODE_NODE_MODULES_CACHE_DIR = '.vscode-node-modules'

/**
 * @param {string} repoPath
 */
export const cacheNodeModules = async (repoPath) => {
  try {
    const cacheKey = await ComputeVscodeNodeModulesCacheKey.computeVscodeNodeModulesCacheKey(repoPath)
    const cacheDir = join(Root.root, VSCODE_NODE_MODULES_CACHE_DIR)
    const cachedNodeModulesPath = join(cacheDir, cacheKey)

    // Find all node_modules directories in the repository using glob
    const allNodeModulesPaths = await Array.fromAsync(glob('**/node_modules', { cwd: repoPath }))
    const nodeModulesPaths = allNodeModulesPaths.filter((path) => !path.includes('node_modules/node_modules') && !path.includes('.git'))

    const fileOperations = await GetCacheFileOperations.getCacheFileOperations(repoPath, cacheKey, cacheDir, cachedNodeModulesPath, nodeModulesPaths)
    await ApplyFileOperations.applyFileOperations(fileOperations)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn(`Failed to cache node_modules: ${errorMessage}`)
  }
}