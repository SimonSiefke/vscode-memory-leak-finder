import { cp, mkdir, rm, readFile, glob } from 'node:fs/promises'
import { pathExists } from 'path-exists'

/**
 * Checks if a path exists
 * @param {string} path
 * @returns {Promise<boolean>}
 */
export { pathExists }

/**
 * Copies a file or directory
 * @param {string} from - Source path
 * @param {string} to - Destination path
 * @param {{recursive?: boolean, force?: boolean}} options - Copy options
 * @returns {Promise<void>}
 */
export const copy = async (from, to, options = { recursive: true, force: true }): Promise<void> => {
  await cp(from, to, options)
}

/**
 * Creates a directory
 * @param {string} path - Directory path to create
 * @param {{recursive?: boolean}} options - Directory creation options
 * @returns {Promise<void>}
 */
export const makeDirectory = async (path: string, options = { recursive: true }): Promise<void> => {
  await mkdir(path, options)
}

/**
 * Removes a file or directory
 * @param {string} path - Path to remove
 * @param {{recursive?: boolean, force?: boolean}} options - Remove options
 * @returns {Promise<void>}
 */
export const remove = async (path: string, options = { recursive: true, force: true }): Promise<void> => {
  await rm(path, options)
}

/**
 * Reads a file
 * @param {string} path - File path to read
 * @param {string} encoding - File encoding (default: 'utf8')
 * @returns {Promise<string>}
 */
export const readFileContent = async (path: string, encoding: BufferEncoding = 'utf8'): Promise<string> => {
  return await readFile(path, { encoding })
}

/**
 * Finds files using glob pattern
 * @param {string} pattern - Glob pattern
 * @param {{cwd?: string, exclude?: string[]}} options - Glob options
 * @returns {Promise<string[]>}
 */
export const findFiles = async (pattern: string, options: {cwd?: string, exclude?: string[]} = {}): Promise<string[]> => {
  const globIterator = glob(pattern, options)
  return await Array.fromAsync(globIterator)
}