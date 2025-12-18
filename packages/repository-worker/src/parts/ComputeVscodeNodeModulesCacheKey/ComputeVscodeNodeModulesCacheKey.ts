import { VError } from '@lvce-editor/verror'
import { findPackageLockFiles } from '../FindPackageLockFiles/FindPackageLockFiles.ts'
import { getFilesHash } from '../GetFilesHash/GetFilesHash.ts'

/**
 * @param {string} folder
 */
export const computeVscodeNodeModulesCacheKey = async (folder: string): Promise<string> => {
  try {
    const packageLockFiles = await findPackageLockFiles(folder)
    const hash = getFilesHash(packageLockFiles)
    return hash
  } catch (error) {
    throw new VError(error, 'Failed to compute VS Code node_modules cache key')
  }
}
