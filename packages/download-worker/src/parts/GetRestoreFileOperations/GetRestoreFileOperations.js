import { join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'
import { glob } from 'node:fs/promises'

/**
 * @typedef {Object} FileOperation
 * @property {'copy' | 'remove'} type
 * @property {string} from
 * @property {string} to
 */

/**
 * @param {string} repoPath
 * @param {string} cacheKey
 * @param {string} cacheDir
 * @param {string} cachedNodeModulesPath
 * @returns {Promise<FileOperation[]>}
 */
export const getRestoreFileOperations = async (repoPath, cacheKey, cacheDir, cachedNodeModulesPath) => {
  try {
    // Check if cached node_modules exists
    if (!existsSync(cachedNodeModulesPath)) {
      console.log(`No cached node_modules found for cache key: ${cacheKey}`)
      return []
    }

    console.log(`Found cached node_modules for cache key: ${cacheKey}`)

    const fileOperations = []

    // Find all cached node_modules directories using glob
    const allCachedNodeModulesPaths = await Array.fromAsync(
      glob('**/node_modules', { cwd: cachedNodeModulesPath }),
      path => path
    )
    const cachedNodeModulesPaths = allCachedNodeModulesPaths.filter(path =>
      !path.includes('node_modules/node_modules')
    )

    // Convert relative paths to absolute paths
    const absoluteCachedNodeModulesPaths = cachedNodeModulesPaths.map(path => join(cachedNodeModulesPath, path))

    for (const cachedNodeModulesPath of absoluteCachedNodeModulesPaths) {
      if (existsSync(cachedNodeModulesPath)) {
        // Calculate the target path in the repo by removing the cache prefix
        const relativePath = cachedNodeModulesPath.replace(join(cacheDir, cacheKey), '').replace(/^\/+/, '')
        const targetPath = join(repoPath, relativePath)

        // Create parent directory if it doesn't exist
        const parentDir = join(targetPath, '..')
        if (!existsSync(parentDir)) {
          mkdirSync(parentDir, { recursive: true })
        }

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
