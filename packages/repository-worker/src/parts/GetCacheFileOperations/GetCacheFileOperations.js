import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

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
 * @param {string} repoPathUri - File URI of the repository path
 * @param {string} cacheKey
 * @param {string} cacheDirUri - File URI of the cache directory
 * @param {string} cachedNodeModulesPathUri - File URI of the cached node_modules path
 * @param {string[]} nodeModulesPaths - Relative paths within the repo
 * @returns {Promise<FileOperation[]>}
 */
export const getCacheFileOperations = async (repoPathUri, cacheKey, cacheDirUri, cachedNodeModulesPathUri, nodeModulesPaths) => {
  console.log(`Preparing to cache node_modules tree with cache key: ${cacheKey}`)

  /**
   * @type {FileOperation[]}
   */
  const fileOperations = []

  // Convert URIs to paths for path manipulation
  const repoPath = fileURLToPath(repoPathUri)
  const cachedNodeModulesPath = fileURLToPath(cachedNodeModulesPathUri)

  // Add directory creation operations
  fileOperations.push(
    {
      type: /** @type {'mkdir'} */ ('mkdir'),
      path: cacheDirUri,
    },
    {
      type: /** @type {'mkdir'} */ ('mkdir'),
      path: cachedNodeModulesPathUri,
    },
  )

  // Convert relative paths to absolute paths
  const absoluteNodeModulesPaths = nodeModulesPaths.map((path) => join(repoPath, path))

  for (const nodeModulesPath of absoluteNodeModulesPaths) {
    // Calculate relative path from repo root to maintain directory structure
    const relativePath = nodeModulesPath.replace(repoPath, '').replace(/^\/+/, '')
    const cacheTargetPath = join(cachedNodeModulesPath, relativePath)

    // Convert to file URIs using pathToFileURL for absolute paths
    const nodeModulesPathUri = pathToFileURL(nodeModulesPath).href
    const cacheTargetPathUri = pathToFileURL(cacheTargetPath).href

    // Add parent directory creation operation
    const parentDir = join(cacheTargetPath, '..')
    const parentDirUri = pathToFileURL(parentDir).href
    fileOperations.push(
      {
        type: /** @type {'mkdir'} */ ('mkdir'),
        path: parentDirUri,
      },
      {
        type: /** @type {'copy'} */ ('copy'),
        from: nodeModulesPathUri,
        to: cacheTargetPathUri,
      },
    )
  }

  return fileOperations
}
