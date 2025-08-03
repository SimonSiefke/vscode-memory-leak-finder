import { VError } from '@lvce-editor/verror'
import * as Path from '../Path/Path.js'

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
 * @param {string} repoPath - File URI of the repository path
 * @param {string} cacheKey
 * @param {string} cacheDir - File URI of the cache directory
 * @param {string} cachedNodeModulesPath - File URI of the cached node_modules path
 * @param {string[]} cachedNodeModulesPaths - Relative paths within the cache
 * @returns {Promise<FileOperation[]>}
 */
export const getRestoreNodeModulesFileOperations = async (repoPath, cacheKey, cacheDir, cachedNodeModulesPath, cachedNodeModulesPaths) => {
  try {
    const fileOperations = []

    // Convert relative paths to absolute paths
    const absoluteCachedNodeModulesPaths = cachedNodeModulesPaths.map((path) => Path.join(cachedNodeModulesPath, path))

    for (const cachedNodeModulesPathItem of absoluteCachedNodeModulesPaths) {
      // TODO what is this
      const relativePath = cachedNodeModulesPathItem.replace(Path.join(cacheDir, cacheKey), '').replace(/^\/+/, '')
      const sourceNodeModulesPath = Path.join(cachedNodeModulesPath, relativePath)
      const targetPath = Path.join(repoPath, relativePath)
      fileOperations.push({
        type: /** @type {'copy'} */ ('copy'),
        from: sourceNodeModulesPath,
        to: targetPath,
      })
    }

    return fileOperations
  } catch (error) {
    throw new VError(error, 'Failed to get restore file operations')
  }
}
