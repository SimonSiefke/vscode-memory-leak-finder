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
 * @param {string} cachedNodeModulesPath - File URI of the cached node_modules path
 * @param {string[]} cachedNodeModulesPaths - Relative paths within the cache
 * @returns {Promise<FileOperation[]>}
 */
export const getRestoreNodeModulesFileOperations = async (repoPath, cacheKey, cacheDir, cachedNodeModulesPath, cachedNodeModulesPaths) => {
  try {
    const fileOperations = []

    // Convert relative paths to absolute paths
    const absoluteCachedNodeModulesPaths = cachedNodeModulesPaths.map((path) => join(cachedNodeModulesPath, path))

    for (const cachedNodeModulesPathItem of absoluteCachedNodeModulesPaths) {
      if (await pathExists(cachedNodeModulesPathItem)) {
        // TODO what is this
        const relativePath = cachedNodeModulesPathItem.replace(join(cacheDir, cacheKey), '').replace(/^\/+/, '')
        const sourceNodeModulesPath = join(cachedNodeModulesPath, relativePath)
        const targetPath = join(repoPath, relativePath)
        fileOperations.push({
          type: /** @type {'copy'} */ ('copy'),
          from: sourceNodeModulesPath,
          to: targetPath,
        })
      }
    }

    return fileOperations
  } catch (error) {
    throw new VError(error, `Failed to get restore file operations`)
  }
}
