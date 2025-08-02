import { VError } from '@lvce-editor/verror'
import { glob } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Finds all package-lock.json files in a directory using glob
 * @param {string} folder - of the directory to search in
 * @returns {Promise<string[]>} - Array of paths to package-lock.json files
 */
export const findPackageLockFiles = async (folder) => {
  try {
    const globIterator = glob('**/package-lock.json', {
      cwd: folder,
      exclude: ['**/node_modules/**'],
    })
    const packageLockPaths = await Array.fromAsync(globIterator)
    const absolutePaths = packageLockPaths.map((path) => join(folder, path))
    return absolutePaths
  } catch (error) {
    throw new VError(error, `Failed to find package-lock.json files in directory '${folder}'`)
  }
}
