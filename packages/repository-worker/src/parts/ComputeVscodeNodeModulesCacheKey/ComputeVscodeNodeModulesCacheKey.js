import { findPackageLockFiles } from '../FindPackageLockFiles/FindPackageLockFiles.js'
import { getFilesHash } from '../GetFilesHash/GetFilesHash.js'
import { VError } from '@lvce-editor/verror'

/**
 * @param {string} folder
 */
export const computeVscodeNodeModulesCacheKey = async (folder) => {
  try {
    const packageLockFiles = await findPackageLockFiles(folder)
    return getFilesHash(packageLockFiles)
  } catch (error) {
    throw new VError(error, `Failed to compute VS Code node_modules cache key`)
  }
}
