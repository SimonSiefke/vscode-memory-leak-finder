import { join } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { pathExists } from 'path-exists'
import { VError } from '@lvce-editor/verror'

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
 * @typedef {Object} RemoveOperation
 * @property {'remove'} type
 * @property {string} from
 */

/**
 * @typedef {CopyOperation | MkdirOperation | RemoveOperation} FileOperation
 */

/**
 * @param {string} repoPathUri - File URI of the repository path
 * @param {string} cacheKey
 * @param {string} cacheDirUri - File URI of the cache directory
 * @param {string} cachedNodeModulesPathUri - File URI of the cached node_modules path
 * @param {string[]} cachedNodeModulesPaths - Relative paths within the cache
 * @returns {Promise<FileOperation[]>}
 */
export const getRestoreNodeModulesFileOperations = async (repoPathUri, cacheKey, cacheDirUri, cachedNodeModulesPathUri, cachedNodeModulesPaths) => {
  try {
    // Convert URIs to paths for file system operations
    const repoPath = fileURLToPath(repoPathUri)
    const cacheDir = fileURLToPath(cacheDirUri)
    const cachedNodeModulesPath = fileURLToPath(cachedNodeModulesPathUri)

    // Check if cached node_modules exists
    if (!(await pathExists(cachedNodeModulesPath))) {
      console.log(`No cached node_modules found for cache key: ${cacheKey}`)
      return []
    }

    console.log(`Found cached node_modules for cache key: ${cacheKey}`)

    const fileOperations = []

    // Convert relative paths to absolute paths
    const absoluteCachedNodeModulesPaths = cachedNodeModulesPaths.map((path) => join(cachedNodeModulesPath, path))

    for (const cachedNodeModulesPathItem of absoluteCachedNodeModulesPaths) {
      if (await pathExists(cachedNodeModulesPathItem)) {
        // Calculate the target path in the repo by removing the cache prefix
        const relativePath = cachedNodeModulesPathItem.replace(join(cacheDir, cacheKey), '').replace(/^\/+/, '')
        const targetPath = join(repoPath, relativePath)

        // Add parent directory creation operation
        const parentDir = join(targetPath, '..')
        const parentDirUri = pathToFileURL(parentDir).href
        fileOperations.push({
          type: /** @type {'mkdir'} */ ('mkdir'),
          path: parentDirUri,
        })

        // Use URL join for the file URIs
        const sourceNodeModulesPathUri = new URL(relativePath, cachedNodeModulesPathUri).href
        const targetPathUri = new URL(relativePath, repoPathUri).href
        fileOperations.push({
          type: /** @type {'copy'} */ ('copy'),
          from: sourceNodeModulesPathUri,
          to: targetPathUri,
        })
      }
    }

    return fileOperations
  } catch (error) {
    throw new VError(error, `Failed to get restore file operations`)
  }
}
