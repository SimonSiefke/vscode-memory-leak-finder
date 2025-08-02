import { readFile } from 'node:fs/promises'
import { getHash } from '../GetHash/GetHash.js'
import { VError } from '@lvce-editor/verror'

/**
 * Reads multiple files and returns their combined hash
 * @param {string[]} fileUris - Array of file URIs to read
 * @returns {Promise<string>} - Hexadecimal hash string of all file contents
 */
export const getFilesHash = async (fileUris) => {
  try {
    const contents = await Promise.all(fileUris.map((file) => readFile(file, 'utf8')))
    return getHash(contents)
  } catch (error) {
    throw new VError(error, `Failed to get files hash`)
  }
}
