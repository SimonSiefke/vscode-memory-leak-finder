import { VError } from '@lvce-editor/verror'
import * as Filesystem from '../Filesystem/Filesystem.js'
import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.js'
import * as GetRestoreFileOperations from '../GetRestoreFileOperations/GetRestoreFileOperations.js'
import * as Path from '../Path/Path.js'

/**
 * @param {string} repoPath
 * @param {string} commitHash
 * @param {string} cacheDir
 */
export const setupNodeModulesFromCache = async (repoPath, commitHash, cacheDir) => {
  try {
    const cachedNodeModulesPath = Path.join(cacheDir, commitHash)
    const allCachedNodeModulesPaths = await Filesystem.findFiles('**/node_modules', { cwd: cachedNodeModulesPath })
    const cachedNodeModulesPaths = allCachedNodeModulesPaths.filter((path) => !path.includes('node_modules/node_modules'))
    const fileOperations = await GetRestoreFileOperations.getRestoreNodeModulesFileOperations(
      repoPath,
      commitHash,
      cacheDir,
      cachedNodeModulesPath,
      cachedNodeModulesPaths,
    )
    await FileSystemWorker.applyFileOperations(fileOperations)
  } catch (error) {
    throw new VError(error, 'Failed to setup node_modules from cache')
  }
}
