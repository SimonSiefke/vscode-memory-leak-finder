import { VError } from '@lvce-editor/verror'
import { findFiles } from '../Filesystem/Filesystem.js'
import { join } from 'node:path'
import * as ApplyFileOperations from '../ApplyFileOperations/ApplyFileOperations.js'
import * as GetRestoreFileOperations from '../GetRestoreFileOperations/GetRestoreFileOperations.js'

/**
 * @param {string} cachedNodeModulesPath
 */
const findCachedNodeModulesPaths = async (cachedNodeModulesPath) => {
  const allCachedNodeModulesPaths = await findFiles('**/node_modules', { cwd: cachedNodeModulesPath })
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
