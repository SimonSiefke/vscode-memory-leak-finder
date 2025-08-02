import { readFile } from 'node:fs/promises'
import { getHash } from '../GetHash/GetHash.js'
import { findPackageLockFiles } from '../FindPackageLockFiles/FindPackageLockFiles.js'

/**
 * @param {string} repoPath
 */
export const computeVscodeNodeModulesCacheKey = async (repoPath) => {
  try {
    const packageLockFiles = await findPackageLockFiles(repoPath)
    const contents = await Promise.all(packageLockFiles.map((file) => readFile(file, 'utf8')))

    return getHash(contents)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to compute VS Code node_modules cache key: ${errorMessage}`)
  }
}
