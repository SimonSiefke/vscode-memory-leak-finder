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

type FileOperation = CopyOperation | MkdirOperation

/**
 * @param {string} repoPath - File path of the repository
 * @param {string} cacheKey
 * @param {string} cacheDir - File path of the cache directory
 * @param {string} cachedNodeModulesPath - File path of the cached node_modules path
 * @param {string[]} nodeModulesPaths - Relative paths within the repo
 * @returns {Promise<FileOperation[]>}
 */
export const getCacheFileOperations = async (repoPath: string, cacheKey: string, cacheDir: string, cachedNodeModulesPath: string, nodeModulesPaths: string[]): Promise<FileOperation[]> => {
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
  const absoluteNodeModulesPaths = nodeModulesPaths.map((path) => Path.join(repoPath, path))
  for (const nodeModulesPath of absoluteNodeModulesPaths) {
    const relativePath = nodeModulesPath.replace(repoPath, '').replace(/^\/+/, '')
    const cacheTargetPath = Path.join(cachedNodeModulesPath, relativePath)
    const parentDir = Path.join(cacheTargetPath, '..')
    fileOperations.push(
      {
        type: 'mkdir',
        path: parentDir,
      },
      {
        type: 'copy',
        from: nodeModulesPath,
        to: cacheTargetPath,
      },
    )
  }

  return fileOperations
}
