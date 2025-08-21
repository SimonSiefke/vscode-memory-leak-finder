import { VError } from '@lvce-editor/verror'
import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'
import * as GetCacheFileOperations from '../GetCacheFileOperations/GetCacheFileOperations.ts'
import * as Path from '../Path/Path.ts'

export const addNodeModulesToCache = async (repoPath: string, commitHash: string, cacheDir: string) => {
  try {
    const cachedNodeModulesPath = Path.join(cacheDir, commitHash)
    const allNodeModulesPaths = await FileSystemWorker.findFiles('**/node_modules', { cwd: repoPath })
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
