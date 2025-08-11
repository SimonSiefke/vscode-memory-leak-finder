import { VError } from '@lvce-editor/verror'
import * as Filesystem from '../Filesystem/Filesystem.js'
import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.js'
import * as GetCacheFileOperations from '../GetCacheFileOperations/GetCacheFileOperations.js'
import * as Path from '../Path/Path.js'
import * as Filesystem from '../Filesystem/Filesystem.ts'
import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'
import * as GetCacheFileOperations from '../GetCacheFileOperations/GetCacheFileOperations.ts'
import * as Path from '../Path/Path.ts'

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
    await FileSystemWorker.applyFileOperations(fileOperations)
  } catch (error) {
    throw new VError(error, 'Failed to cache node_modules')
  }
}
