import { VError } from '@lvce-editor/verror'
import * as Path from '../Path/Path.ts'
import * as Filesystem from '../Filesystem/Filesystem.ts'

/**
 * @param {string} commitHash
 * @param {string} cacheDir
 * @returns {Promise<boolean>}
 */
export const checkCacheExists = async (cacheDir, hash) => {
  try {
    const cachedNodeModulesPath = Path.join(cacheDir, commitHash)
    return await Filesystem.pathExists(cachedNodeModulesPath)
  } catch (error) {
    throw new VError(error, `Failed to check if cache exists for commit hash: ${commitHash}`)
  }
}
