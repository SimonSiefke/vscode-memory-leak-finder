import { join } from 'node:path'
import { pathExists } from 'path-exists'
import { pathToFileURL } from 'node:url'
import { VError } from '@lvce-editor/verror'

/**
 * @param {string} commitHash
 * @param {string} cacheDir
 * @returns {Promise<boolean>}
 */
export const checkCacheExists = async (commitHash, cacheDir) => {
  try {
    const cachedNodeModulesPath = join(cacheDir, commitHash)

    return await pathExists(cachedNodeModulesPath)
  } catch (error) {
    throw new VError(error, `Failed to check if cache exists for commit hash: ${commitHash}`)
  }
}
