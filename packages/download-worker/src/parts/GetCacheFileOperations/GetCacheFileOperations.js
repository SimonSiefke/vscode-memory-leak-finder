import { join } from 'node:path'
import { existsSync } from 'node:fs'

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

  // Add directory creation operations
  fileOperations.push({
    type: 'mkdir',
    path: cacheDir,
  })
  fileOperations.push({
    type: 'mkdir',
    path: cachedNodeModulesPath,
  })

  // Convert relative paths to absolute paths
  const absoluteNodeModulesPaths = nodeModulesPaths.map((path) => join(repoPath, path))

  for (const nodeModulesPath of absoluteNodeModulesPaths) {
    // Calculate relative path from repo root to maintain directory structure
    const relativePath = nodeModulesPath.replace(repoPath, '').replace(/^\/+/, '')
    const cacheTargetPath = join(cachedNodeModulesPath, relativePath)

    // Add parent directory creation operation
    const parentDir = join(cacheTargetPath, '..')
    fileOperations.push({
      type: 'mkdir',
      path: parentDir,
    })

    fileOperations.push({
      type: 'copy',
      from: nodeModulesPath,
      to: cacheTargetPath,
    })
  }

  return fileOperations
}
