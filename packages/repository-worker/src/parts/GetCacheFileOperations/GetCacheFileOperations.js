import { join } from 'node:path'

/**
 * @typedef {Object} CopyOperation
 * @property {'copy'} type
 * @property {string} from
 * @property {string} to
 */

/**
 * @typedef {Object} MkdirOperation
 * @property {'mkdir'} type
 * @property {string} path
 */

/**
 * @typedef {CopyOperation | MkdirOperation} FileOperation
 */

/**
 * @param {string} repoPath - File URI of the repository path
 * @param {string} cacheKey
 * @param {string} cacheDir - File URI of the cache directory
 * @param {string} cachedNodeModulesPath - File URI of the cached node_modules path
 * @param {string[]} nodeModulesPaths - Relative paths within the repo
 * @returns {Promise<FileOperation[]>}
 */
export const getCacheFileOperations = async (repoPath, cacheKey, cacheDir, cachedNodeModulesPath, nodeModulesPaths) => {
  console.log(`Preparing to cache node_modules tree with cache key: ${cacheKey}`)

  /**
   * @type {FileOperation[]}
   */
  const fileOperations = []

  // Add directory creation operations
  fileOperations.push(
    {
      type: /** @type {'mkdir'} */ ('mkdir'),
      path: cacheDir,
    },
    {
      type: /** @type {'mkdir'} */ ('mkdir'),
      path: cachedNodeModulesPath,
    },
  )

  // Convert relative paths to absolute paths
  const absoluteNodeModulesPaths = nodeModulesPaths.map((path) => join(repoPath, path))

  for (const nodeModulesPath of absoluteNodeModulesPaths) {
    // Calculate relative path from repo root to maintain directory structure
    const relativePath = nodeModulesPath.replace(repoPath, '').replace(/^\/+/, '')
    const cacheTargetPath = join(cachedNodeModulesPath, relativePath)
    // Add parent directory creation operation
    const parentDir = join(cacheTargetPath, '..')
    fileOperations.push(
      {
        type: /** @type {'mkdir'} */ ('mkdir'),
        path: parentDir,
      },
      {
        type: /** @type {'copy'} */ ('copy'),
        from: nodeModulesPath,
        to: cacheTargetPath,
      },
    )
  }

  return fileOperations
}
