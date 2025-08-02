import { findPackageLockFiles } from '../FindPackageLockFiles/FindPackageLockFiles.js'
import { getFilesHash } from '../GetFilesHash/GetFilesHash.js'
import { VError } from '@lvce-editor/verror'

/**
 * @param {string} repositoryFileUri
 */
export const computeVscodeNodeModulesCacheKey = async (repositoryFileUri) => {
  try {
    const packageLockFiles = await findPackageLockFiles(repositoryFileUri)
    return getFilesHash(packageLockFiles)
  } catch (error) {
    throw new VError(error, `Failed to compute VS Code node_modules cache key`)
  }
}
