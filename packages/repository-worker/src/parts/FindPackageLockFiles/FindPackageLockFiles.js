import { glob } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { VError } from '@lvce-editor/verror'

/**
 * Finds all package-lock.json files in a directory using glob
 * @param {string} dirUri - File URI of the directory to search in
 * @returns {Promise<string[]>} - Array of file URIs to package-lock.json files
 */
export const findPackageLockFiles = async (dirUri) => {
  try {
    const dir = fileURLToPath(dirUri)
    const globIterator = glob('**/package-lock.json', {
      cwd: dir,
      exclude: ['**/node_modules/**'],
    })
    const packageLockPaths = await Array.fromAsync(globIterator)
    const absolutePaths = packageLockPaths.map((path) => join(dir, path))
    const fileUris = absolutePaths.map((path) => pathToFileURL(path).href)
    return fileUris
  } catch (error) {
    throw new VError(error, `Failed to find package-lock.json files in directory '${dirUri}'`)
  }
}
