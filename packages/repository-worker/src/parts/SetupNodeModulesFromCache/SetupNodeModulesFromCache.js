import { join } from 'node:path'
import { glob } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { VError } from '@lvce-editor/verror'
import * as GetRestoreFileOperations from '../GetRestoreFileOperations/GetRestoreFileOperations.js'
import * as ApplyFileOperations from '../ApplyFileOperations/ApplyFileOperations.js'

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
 * @param {string} commitHash
 * @param {string} cacheDir
 */
export const setupNodeModulesFromCache = async (repoPath, commitHash, cacheDir) => {
  try {
    const repoPathUri = pathToFileURL(repoPath).href
    const cachedNodeModulesPath = join(cacheDir, commitHash)

    // Convert paths to file URIs
    const cacheDirUri = pathToFileURL(cacheDir).href
    const cachedNodeModulesPathUri = pathToFileURL(cachedNodeModulesPath).href

    const cachedNodeModulesPaths = await findCachedNodeModulesPaths(cachedNodeModulesPath)

    const fileOperations = await GetRestoreFileOperations.getRestoreNodeModulesFileOperations(
      repoPathUri,
      commitHash,
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
