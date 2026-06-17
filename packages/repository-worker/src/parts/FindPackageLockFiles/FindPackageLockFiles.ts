import { VError } from '@lvce-editor/verror'
import { findFiles } from '../FileSystemWorker/FileSystemWorker.ts'
import * as Path from '../Path/Path.ts'

const packageLockPatterns = ['**/package-lock.json', '.vscode/**/package-lock.json'] as const

/**
 * Finds all package-lock.json files in a directory using glob
 * @param {string} folder - of the directory to search in
 * @returns {Promise<string[]>} - Array of paths to package-lock.json files
 */
export const findPackageLockFiles = async (folder: string): Promise<readonly string[]> => {
  try {
    const packageLockPaths = await findFiles(packageLockPatterns, {
      cwd: folder,
      exclude: ['**/node_modules/**'],
    })
    const absolutePaths = Array.from(new Set(packageLockPaths), (path) => Path.join(folder, path))
    return absolutePaths
  } catch (error) {
    throw new VError(error, `Failed to find package-lock.json files in directory '${folder}'`)
  }
}
