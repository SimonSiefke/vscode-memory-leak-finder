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
    const cachedNodeModulesPath = join(cacheDir, commitHash)
    const cachedNodeModulesPaths = await findCachedNodeModulesPaths(cachedNodeModulesPath)
    const fileOperations = await GetRestoreFileOperations.getRestoreNodeModulesFileOperations(
      repoPath,
      commitHash,
      cacheDir,
      cachedNodeModulesPath,
      cachedNodeModulesPaths,
    )
    await ApplyFileOperations.applyFileOperations(fileOperations)
  } catch (error) {
    throw new VError(error, `Failed to setup node_modules from cache`)
  }
}
