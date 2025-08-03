import { VError } from '@lvce-editor/verror'
import * as Path from '../Path/Path.js'
import * as Filesystem from '../Filesystem/Filesystem.js'

/**
 * @param {string} commitHash
 * @param {string} cacheDir
 * @returns {Promise<boolean>}
 */
export const checkCacheExists = async (commitHash, cacheDir) => {
  try {
    const cachedNodeModulesPath = Path.join(cacheDir, commitHash)

    return await Filesystem.pathExists(cachedNodeModulesPath)
  } catch (error) {
    throw new VError(error, `Failed to check if cache exists for commit hash: ${commitHash}`)
  }
}
