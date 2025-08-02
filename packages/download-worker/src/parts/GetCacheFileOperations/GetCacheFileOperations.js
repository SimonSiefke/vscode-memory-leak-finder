import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

/**
 * @param {string} repoPath
 * @param {string} cacheKey
 * @param {string} cacheDir
 * @param {string} cachedNodeModulesPath
 * @param {string[]} nodeModulesPaths
 * @returns {Promise<any[]>}
 */
export const getCacheFileOperations = async (repoPath, cacheKey, cacheDir, cachedNodeModulesPath, nodeModulesPaths) => {
  console.log(`Preparing to cache node_modules tree with cache key: ${cacheKey}`)

  /**
   * @type {any[]}
   */
  const fileOperations = []

  // Convert paths to file URIs
  const repoPathUri = pathToFileURL(repoPath).href
  const cacheDirUri = pathToFileURL(cacheDir).href
  const cachedNodeModulesPathUri = pathToFileURL(cachedNodeModulesPath).href

  // Add directory creation operations
  fileOperations.push({
    type: 'mkdir',
    path: cacheDirUri,
  })
  fileOperations.push({
    type: 'mkdir',
    path: cachedNodeModulesPathUri,
  })

  // Convert relative paths to absolute paths
  const absoluteNodeModulesPaths = nodeModulesPaths.map((path) => join(repoPath, path))

  for (const nodeModulesPath of absoluteNodeModulesPaths) {
    // Calculate relative path from repo root to maintain directory structure
    const relativePath = nodeModulesPath.replace(repoPath, '').replace(/^\/+/, '')
    const cacheTargetPath = join(cachedNodeModulesPath, relativePath)

    // Convert to file URIs
    const nodeModulesPathUri = pathToFileURL(nodeModulesPath).href
    const cacheTargetPathUri = pathToFileURL(cacheTargetPath).href

    // Add parent directory creation operation
    const parentDir = join(cacheTargetPath, '..')
    const parentDirUri = pathToFileURL(parentDir).href
    fileOperations.push({
      type: 'mkdir',
      path: parentDirUri,
    })

    fileOperations.push({
      type: 'copy',
      from: nodeModulesPathUri,
      to: cacheTargetPathUri,
    })
  }

  return fileOperations
}
