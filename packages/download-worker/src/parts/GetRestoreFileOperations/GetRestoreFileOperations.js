import { join } from 'node:path'
import { existsSync } from 'node:fs'

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
 * @param {string[]} cachedNodeModulesPaths
 * @returns {Promise<FileOperation[]>}
 */
export const getRestoreFileOperations = async (repoPath, cacheKey, cacheDir, cachedNodeModulesPath, cachedNodeModulesPaths) => {
  try {
    // Check if cached node_modules exists
    if (!existsSync(cachedNodeModulesPath)) {
      console.log(`No cached node_modules found for cache key: ${cacheKey}`)
      return []
    }

    console.log(`Found cached node_modules for cache key: ${cacheKey}`)

    const fileOperations = []

    // Convert relative paths to absolute paths
    const absoluteCachedNodeModulesPaths = cachedNodeModulesPaths.map(path => join(cachedNodeModulesPath, path))

    for (const cachedNodeModulesPath of absoluteCachedNodeModulesPaths) {
      if (existsSync(cachedNodeModulesPath)) {
        // Calculate the target path in the repo by removing the cache prefix
        const relativePath = cachedNodeModulesPath.replace(join(cacheDir, cacheKey), '').replace(/^\/+/, '')
        const targetPath = join(repoPath, relativePath)

        // Add parent directory creation operation
        const parentDir = join(targetPath, '..')
        fileOperations.push({
          type: 'mkdir',
          path: parentDir,
        })

        fileOperations.push({
          type: 'copy',
          from: cachedNodeModulesPath,
          to: targetPath,
        })
      }
    }

    return fileOperations
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn(`Failed to get restore file operations: ${errorMessage}`)
    return []
  }
}
