import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { glob } from 'node:fs/promises'

/**
 * @typedef {Object} FileOperation
 * @property {'copy' | 'remove' | 'mkdir'} type
 * @property {string} from
 * @property {string} to
 * @property {string} path
 */

/**
 * @param {string} repoPath
 * @param {string} cacheKey
 * @param {string} cacheDir
 * @param {string} cachedNodeModulesPath
 * @returns {Promise<FileOperation[]>}
 */
export const getCacheFileOperations = async (repoPath, cacheKey, cacheDir, cachedNodeModulesPath) => {
  try {
    console.log(`Preparing to cache node_modules tree with cache key: ${cacheKey}`)

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

    // Find all node_modules directories in the repository using glob
    const allNodeModulesPaths = await Array.fromAsync(glob('**/node_modules', { cwd: repoPath }))
    const nodeModulesPaths = allNodeModulesPaths.filter((path) => !path.includes('node_modules/node_modules') && !path.includes('.git'))

    // Convert relative paths to absolute paths
    const absoluteNodeModulesPaths = nodeModulesPaths.map((path) => join(repoPath, path))

    for (const nodeModulesPath of absoluteNodeModulesPaths) {
      if (existsSync(nodeModulesPath)) {
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
    }

    return fileOperations
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn(`Failed to get cache file operations: ${errorMessage}`)
    return []
  }
}
