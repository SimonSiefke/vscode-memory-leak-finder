import { join } from 'node:path'
import * as GetRestoreFileOperations from '../GetRestoreFileOperations/GetRestoreFileOperations.js'
import * as ApplyFileOperations from '../ApplyFileOperations/ApplyFileOperations.js'
import * as ComputeVscodeNodeModulesCacheKey from '../ComputeVscodeNodeModulesCacheKey/ComputeVscodeNodeModulesCacheKey.js'
import * as Root from '../Root/Root.js'

const VSCODE_NODE_MODULES_CACHE_DIR = '.vscode-node-modules'

/**
 * @param {string} repoPath
 */
export const setupNodeModulesFromCache = async (repoPath) => {
  try {
    const cacheKey = await ComputeVscodeNodeModulesCacheKey.computeVscodeNodeModulesCacheKey(repoPath)
    const cacheDir = join(Root.root, VSCODE_NODE_MODULES_CACHE_DIR)
    const cachedNodeModulesPath = join(cacheDir, cacheKey)

    const fileOperations = await GetRestoreFileOperations.getRestoreFileOperations(repoPath, cacheKey, cacheDir, cachedNodeModulesPath)

    if (fileOperations.length > 0) {
      await ApplyFileOperations.applyFileOperations(fileOperations)
      return true
    } else {
      return false
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn(`Failed to setup node_modules from cache: ${errorMessage}`)
    return false
  }
}