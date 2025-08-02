import { createHash } from 'node:crypto'

/**
 * Generates a SHA1 hash from an array of strings or buffers
 * @param {Array<string|Buffer>} contents - Array of strings or buffers to hash
 * @returns {string} - Hexadecimal hash string
 */
export const getHash = (contents) => {
  const hash = createHash('sha1')
  for (const content of contents) {
    hash.update(content)
  }
  return hash.digest('hex')
}