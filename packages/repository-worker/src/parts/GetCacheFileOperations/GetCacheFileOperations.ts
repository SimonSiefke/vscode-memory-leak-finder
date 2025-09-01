import * as Path from '../Path/Path.ts'

interface CopyOperation {
  readonly type: 'copy'
  readonly from: string
  readonly to: string
  readonly exclude?:readonly string[]
}

interface MkdirOperation {
 readonly  type: 'mkdir'
 readonly  path: string
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
  const fileOperations: FileOperation[] = []
  fileOperations.push(
    {
      type: 'mkdir',
      path: cacheDir,
    },
    {
      type: 'mkdir',
      path: cachedNodeModulesPath,
    },
  )

  for (const nodeModulePath of nodeModulesPaths) {
    const cacheTargetPath = Path.join(cachedNodeModulesPath, nodeModulePath)
    const sourcePath = Path.join(repoPath, nodeModulePath)
    const parentDir = Path.join(cacheTargetPath, '..')
    fileOperations.push(
      {
        type: 'mkdir',
        path: parentDir,
      },
      {
        type: 'copy',
        from: sourcePath,
        to: cacheTargetPath,
      },
    )
  }

  return fileOperations
}
