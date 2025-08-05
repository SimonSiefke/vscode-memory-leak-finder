import { cp, mkdir, rm, readFile, glob } from 'node:fs/promises'

// TODO maybe move this to filesystem worker to make testing easier

/**
 * Checks if a path exists
 * @param {string} path
 * @returns {Promise<boolean>}
 */

/**
 * Copies a file or directory
 * @param {string} from - Source path
 * @param {string} to - Destination path
 * @param {{recursive?: boolean, force?: boolean}} options - Copy options
 * @returns {Promise<void>}
 */
export const copy = async (from, to, options = { recursive: true, force: true }) => {
  await cp(from, to, options)
}

/**
 *
 * Creates a directory
 * @param {string} path - Directory path to create
 * @param {{recursive?: boolean}} options - Directory creation options
 * @returns {Promise<void>}
 */
export const makeDirectory = async (path, options = { recursive: true }) => {
  await mkdir(path, options)
}

/**
 * Removes a file or directory
 * @param {string} path - Path to remove
 * @param {{recursive?: boolean, force?: boolean}} options - Remove options
 * @returns {Promise<void>}
 */
export const remove = async (path, options = { recursive: true, force: true }) => {
  await rm(path, options)
}

/**
 * Reads a file
 * @param {string} path - File path to read
 * @param {string} encoding - File encoding (default: 'utf8')
 * @returns {Promise<string>}
 */
export const readFileContent = async (path, encoding = 'utf8') => {
  return await readFile(path, { encoding: /** @type {BufferEncoding} */ (encoding) })
}

/**
 * Finds files using glob pattern
 * @param {string} pattern - Glob pattern
 * @param {{cwd?: string, exclude?: string[]}} options - Glob options
 * @returns {Promise<string[]>}
 */
export const findFiles = async (pattern, options = {}) => {
  const globIterator = glob(pattern, options)
  return await Array.fromAsync(globIterator)
}

export { pathExists } from 'path-exists'
