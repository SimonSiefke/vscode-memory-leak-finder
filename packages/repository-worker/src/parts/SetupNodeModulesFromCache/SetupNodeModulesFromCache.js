import { join } from 'node:path'
import { VError } from '@lvce-editor/verror'
import * as ApplyFileOperations from '../ApplyFileOperations/ApplyFileOperations.js'
import * as Filesystem from '../Filesystem/Filesystem.js'
import * as GetRestoreFileOperations from '../GetRestoreFileOperations/GetRestoreFileOperations.js'

/**
 * @param {string} repoPath
 * @param {string} commitHash
 * @param {string} cacheDir
 */
export const setupNodeModulesFromCache = async (repoPath, commitHash, cacheDir) => {
  try {
    const cachedNodeModulesPath = join(cacheDir, commitHash)
    const allCachedNodeModulesPaths = await Filesystem.findFiles('**/node_modules', { cwd: cachedNodeModulesPath })
    const cachedNodeModulesPaths = allCachedNodeModulesPaths.filter((path) => !path.includes('node_modules/node_modules'))
    const fileOperations = await GetRestoreFileOperations.getRestoreNodeModulesFileOperations(
      repoPath,
      commitHash,
      cacheDir,
      cachedNodeModulesPath,
      cachedNodeModulesPaths,
    )
    await ApplyFileOperations.applyFileOperations(fileOperations)
  } catch (error) {
    throw new VError(error, 'Failed to setup node_modules from cache')
  }
}
