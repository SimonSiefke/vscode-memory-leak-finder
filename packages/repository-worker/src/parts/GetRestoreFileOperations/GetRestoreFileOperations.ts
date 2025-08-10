import { VError } from '@lvce-editor/verror'
import * as Path from '../Path/Path.ts'

interface CopyOperation {
  type: 'copy'
  from: string
  to: string
}

interface MkdirOperation {
  type: 'mkdir'
  path: string
}

interface RemoveOperation {
  type: 'remove'
  from: string
}

type FileOperation = CopyOperation | MkdirOperation | RemoveOperation

/**
 * @param {string} repoPath - File URI of the repository path
 * @param {string} cacheKey
 * @param {string} cacheDir - File URI of the cache directory
 * @param {string} cachedNodeModulesPath - File URI of the cached node_modules path
 * @param {string[]} cachedNodeModulesPaths - Relative paths within the cache
 * @returns {Promise<FileOperation[]>}
 */
export const getRestoreNodeModulesFileOperations = async (
  repoPath: string,
  cacheKey: string,
  cacheDir: string,
  cachedNodeModulesPath: string,
  cachedNodeModulesPaths: string[],
): Promise<FileOperation[]> => {
  try {
    const fileOperations: FileOperation[] = []

    // Convert relative paths to absolute paths
    const absoluteCachedNodeModulesPaths = cachedNodeModulesPaths.map((path) => Path.join(cachedNodeModulesPath, path))

    for (const cachedNodeModulesPathItem of absoluteCachedNodeModulesPaths) {
      // TODO what is this
      const relativePath = cachedNodeModulesPathItem.replace(Path.join(cacheDir, cacheKey), '').replace(/^\/+/, '')
      const sourceNodeModulesPath = Path.join(cachedNodeModulesPath, relativePath)
      const targetPath = Path.join(repoPath, relativePath)
      fileOperations.push({
        type: 'copy',
        from: sourceNodeModulesPath,
        to: targetPath,
      })
    }

    return fileOperations
  } catch (error) {
    throw new VError(error, 'Failed to get restore file operations')
  }
}
