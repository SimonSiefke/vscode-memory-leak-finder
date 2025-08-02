import { glob } from 'node:fs/promises'
import { join } from 'node:path'
import { VError } from '@lvce-editor/verror'

/**
 * Finds all package-lock.json files in a directory using glob
 * @param {string} dir - Directory to search in
 * @returns {Promise<string[]>} - Array of full paths to package-lock.json files
 */
export const findPackageLockFiles = async (dir) => {
  try {
    const packageLockPaths = await Array.fromAsync(glob('**/package-lock.json', {
      cwd: dir,
      exclude: ['**/node_modules/**']
    }))
    const absolutePaths = packageLockPaths.map((path) => join(dir, path))

    return absolutePaths
  } catch (error) {
    throw new VError(error, `Failed to find package-lock.json files in directory '${dir}'`)
  }
}
