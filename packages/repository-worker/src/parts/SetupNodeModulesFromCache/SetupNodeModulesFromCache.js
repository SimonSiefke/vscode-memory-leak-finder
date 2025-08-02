import { join } from 'node:path'
import { glob } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { VError } from '@lvce-editor/verror'
import * as GetRestoreFileOperations from '../GetRestoreFileOperations/GetRestoreFileOperations.js'
import * as ApplyFileOperations from '../ApplyFileOperations/ApplyFileOperations.js'
import * as ComputeVscodeNodeModulesCacheKey from '../ComputeVscodeNodeModulesCacheKey/ComputeVscodeNodeModulesCacheKey.js'
import * as Root from '../Root/Root.js'

const VSCODE_NODE_MODULES_CACHE_DIR = '.vscode-node-modules'

/**
 * @param {string} cachedNodeModulesPath
 */
const findCachedNodeModulesPaths = async (cachedNodeModulesPath) => {
  const allCachedNodeModulesPaths = await Array.fromAsync(glob('**/node_modules', { cwd: cachedNodeModulesPath }), (path) => path)
  const cachedNodeModulesPaths = allCachedNodeModulesPaths.filter((path) => !path.includes('node_modules/node_modules'))
  return cachedNodeModulesPaths
}

/**
 * @param {string} repoPath
 */
export const setupNodeModulesFromCache = async (repoPath) => {
  try {
    const cacheKey = await ComputeVscodeNodeModulesCacheKey.computeVscodeNodeModulesCacheKey(repoPath)
    const cacheDir = join(Root.root, VSCODE_NODE_MODULES_CACHE_DIR)
    const cachedNodeModulesPath = join(cacheDir, cacheKey)

    // Convert paths to file URIs
    const repoPathUri = pathToFileURL(repoPath).href
    const cacheDirUri = pathToFileURL(cacheDir).href
    const cachedNodeModulesPathUri = pathToFileURL(cachedNodeModulesPath).href

    const cachedNodeModulesPaths = await findCachedNodeModulesPaths(cachedNodeModulesPath)

    const fileOperations = await GetRestoreFileOperations.getRestoreFileOperations(
      repoPathUri,
      cacheKey,
      cacheDirUri,
      cachedNodeModulesPathUri,
      cachedNodeModulesPaths,
    )

    if (fileOperations.length > 0) {
      await ApplyFileOperations.applyFileOperations(fileOperations)
      return true
    } else {
      return false
    }
  } catch (error) {
    throw new VError(error, `Failed to setup node_modules from cache`)
  }
}
