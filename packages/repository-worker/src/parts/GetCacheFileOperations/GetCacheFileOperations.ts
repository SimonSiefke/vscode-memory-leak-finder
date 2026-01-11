import * as Path from '../Path/Path.ts'

interface CopyOperation {
  readonly exclude?: readonly string[]
  readonly from: string
  readonly to: string
  readonly type: 'copy'
}

interface MkdirOperation {
  readonly path: string
  readonly type: 'mkdir'
}

type FileOperation = CopyOperation | MkdirOperation

/**
 * @param {string} repoPath - File path of the repository
 * @param {string} cacheKey
 * @param {string} cacheDir - File path of the cache directory
 * @param {string} cachedNodeModulesPath - File path of the cached node_modules path
 * @param {string[]} nodeModulesPaths - Relative paths within the repo
 * @returns {Promise<FileOperation[]>}
 */
export const getCacheFileOperations = async (
  repoPath: string,
  cacheKey: string,
  cacheDir: string,
  cachedNodeModulesPath: string,
  nodeModulesPaths: string[],
): Promise<FileOperation[]> => {
  const fileOperations: FileOperation[] = [
    {
      path: cacheDir,
      type: 'mkdir',
    },
    {
      path: cachedNodeModulesPath,
      type: 'mkdir',
    },
  ]

  for (const nodeModulePath of nodeModulesPaths) {
    const cacheTargetPath = Path.join(cachedNodeModulesPath, nodeModulePath)
    const sourcePath = Path.join(repoPath, nodeModulePath)
    const parentDir = Path.join(cacheTargetPath, '..')
    fileOperations.push(
      {
        path: parentDir,
        type: 'mkdir',
      },
      {
        from: sourcePath,
        to: cacheTargetPath,
        type: 'copy',
      },
    )
  }

  return fileOperations
}
