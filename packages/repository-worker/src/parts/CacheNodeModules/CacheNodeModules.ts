import { VError } from '@lvce-editor/verror'
import * as Path from '../Path/Path.ts'
import * as Filesystem from '../Filesystem/Filesystem.ts'
import * as ApplyFileOperations from '../ApplyFileOperations/ApplyFileOperations.ts'
import * as GetCacheFileOperations from '../GetCacheFileOperations/GetCacheFileOperations.ts'

/**
 * @param {string} repoPath
 * @param {string} commitHash
 * @param {string} cacheDir
 */
export const addNodeModulesToCache = async (repoPath, commitHash, cacheDir) => {
  try {
    const cachedNodeModulesPath = Path.join(cacheDir, commitHash)
    const allNodeModulesPaths = await Filesystem.findFiles('**/node_modules', { cwd: repoPath })
    const nodeModulesPaths = allNodeModulesPaths.filter((path) => !path.includes('node_modules/node_modules') && !path.includes('.git'))
    const fileOperations = await GetCacheFileOperations.getCacheFileOperations(
      repoPath,
      commitHash,
      cacheDir,
      cachedNodeModulesPath,
      nodeModulesPaths,
    )
    await ApplyFileOperations.applyFileOperations(fileOperations)
  } catch (error) {
    throw new VError(error, 'Failed to cache node_modules')
  }
}
